sap.ui.define([
    "o2c/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("o2c.controller.Invoices", {

        _selectedInvoice: null,

        // ─── Filter ───────────────────────────────────────────────────────────────

        onFilterChange: function () {
            var sKey     = this.byId("invoiceFilter").getSelectedKey();
            var oBinding = this.byId("invoicesTable").getBinding("items");
            if (sKey === "All") {
                oBinding.filter([]);
            } else {
                oBinding.filter(new Filter("InvoiceStatus", FilterOperator.EQ, sKey));
            }
        },

        // ─── Record Payment ───────────────────────────────────────────────────────

        onRecordPayment: function (oEvent) {
            var oInvoice = oEvent.getSource().getParent().getParent().getBindingContext().getObject();
            this._selectedInvoice = oInvoice;
            this.byId("payInvoiceId").setText(oInvoice.InvoiceId);
            this.byId("payInvoiceAmt").setText("₹" + parseFloat(oInvoice.Amount).toLocaleString("en-IN"));
            this.byId("payAmount").setValue(oInvoice.Amount);
            this.byId("payDate").setValue(this.getToday());
            this.byId("payRemarks").setValue("");
            this.byId("paymentDialog").open();
        },

        onConfirmPayment: function () {
            var nPaid = parseFloat(this.byId("payAmount").getValue()) || 0;
            var sMode = this.byId("payMode").getSelectedKey();
            var sDate = this.byId("payDate").getValue();

            if (nPaid <= 0) { MessageBox.error("Please enter a valid amount."); return; }
            if (!sDate)     { MessageBox.error("Please select payment date.");   return; }

            var oModel = this.getModel();
            var oInv   = this._selectedInvoice;
            var bFull  = nPaid >= oInv.Amount;

            var aPayments = oModel.getProperty("/payments") || [];
            var max = 0;
            aPayments.forEach(function (p) {
                var n = parseInt(p.PaymentId.replace(/\D/g, ""), 10);
                if (n > max) max = n;
            });
            aPayments.push({
                PaymentId:     "PAY-" + String(max + 1).padStart(3, "0"),
                InvoiceId:     oInv.InvoiceId,
                AmountPaid:    nPaid,
                PaymentDate:   sDate,
                PaymentMode:   sMode,
                PaymentStatus: bFull ? "Completed" : "Partial"
            });
            oModel.setProperty("/payments", aPayments);

            var aInvoices = oModel.getProperty("/invoices");
            var idx = aInvoices.findIndex(function (i) { return i.InvoiceId === oInv.InvoiceId; });
            if (idx >= 0) {
                aInvoices[idx].InvoiceStatus = bFull ? "Paid" : "Pending";
                oModel.setProperty("/invoices", aInvoices.slice());
            }

            var nOverdue = aInvoices.filter(function (i) { return i.InvoiceStatus === "Overdue"; }).length;
            oModel.setProperty("/dashboard/overdueInvoices", nOverdue);

            this.byId("paymentDialog").close();
            MessageToast.show("Payment of ₹" + nPaid.toLocaleString("en-IN") + " recorded (" + (bFull ? "Full" : "Partial") + ").");
        },

        onCancelPayment: function () {
            this.byId("paymentDialog").close();
        },

        // ─── Mark Overdue ─────────────────────────────────────────────────────────

        onMarkOverdue: function (oEvent) {
            var oInvoice  = oEvent.getSource().getParent().getParent().getBindingContext().getObject();
            var oModel    = this.getModel();
            var aInvoices = oModel.getProperty("/invoices");
            var idx       = aInvoices.findIndex(function (i) { return i.InvoiceId === oInvoice.InvoiceId; });
            if (idx >= 0) {
                aInvoices[idx].InvoiceStatus = "Overdue";
                oModel.setProperty("/invoices", aInvoices.slice());
                var nOverdue = aInvoices.filter(function (i) { return i.InvoiceStatus === "Overdue"; }).length;
                oModel.setProperty("/dashboard/overdueInvoices", nOverdue);
                MessageToast.show("Invoice " + oInvoice.InvoiceId + " marked as Overdue.");
            }
        },

        // ─── Links ────────────────────────────────────────────────────────────────

        onOrderLink: function (oEvent) {
            // orderDetail route removed — navigate to orders list instead
            this.navTo("orders");
        },

        onRefresh: function () {
            this.byId("invoicesTable").getBinding("items").filter([]);
            this.byId("invoiceFilter").setSelectedKey("All");
            MessageToast.show("Invoices refreshed.");
        },

        // ─── Formatters ───────────────────────────────────────────────────────────

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        },

        formatStatusState: function (s) {
            return BaseController.prototype.formatStatusState.call(this, s);
        },

        // ── Tile formatters — replace the broken .reduce()/.filter() expressions ──

        /**
         * Total invoiced in Lakhs for scale="L" NumericContent.
         * Replaces: {= Math.round(${/invoices}.reduce(...)/ 100000)}
         */
        calcTotalInvoiced: function (aInvoices) {
            if (!aInvoices || !aInvoices.length) return 0;
            var total = aInvoices.reduce(function (s, i) { return s + (i.Amount || 0); }, 0);
            return Math.round(total / 100000);
        },

        /**
         * Count of Overdue invoices.
         * Replaces: {= ${/invoices}.filter(function(i){return i.InvoiceStatus==='Overdue';}).length}
         */
        calcOverdueCount: function (aInvoices) {
            if (!aInvoices) return 0;
            return aInvoices.filter(function (i) { return i.InvoiceStatus === "Overdue"; }).length;
        },

        /**
         * Count of Pending invoices.
         * Replaces: {= ${/invoices}.filter(function(i){return i.InvoiceStatus==='Pending';}).length}
         */
        calcPendingCount: function (aInvoices) {
            if (!aInvoices) return 0;
            return aInvoices.filter(function (i) { return i.InvoiceStatus === "Pending"; }).length;
        }

    });
});