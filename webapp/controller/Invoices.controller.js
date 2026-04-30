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

        onFilterChange: function () {
            var sKey = this.byId("invoiceFilter").getSelectedKey();
            var oBinding = this.byId("invoicesTable").getBinding("items");
            if (sKey === "All") {
                oBinding.filter([]);
            } else {
                oBinding.filter(new Filter("InvoiceStatus", FilterOperator.EQ, sKey));
            }
        },

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

            if (nPaid <= 0) {
                MessageBox.error("Please enter a valid amount.");
                return;
            }
            if (!sDate) {
                MessageBox.error("Please select payment date.");
                return;
            }

            var oModel = this.getModel();
            var oInv = this._selectedInvoice;
            var bFull = nPaid >= oInv.Amount;

            // Add payment record
            var aPayments = oModel.getProperty("/payments") || [];
            var max = 0;
            aPayments.forEach(function (p) { var n = parseInt(p.PaymentId.replace(/\D/g, ""), 10); if (n > max) max = n; });
            aPayments.push({
                PaymentId: "PAY-" + String(max + 1).padStart(3, "0"),
                InvoiceId: oInv.InvoiceId,
                AmountPaid: nPaid,
                PaymentDate: sDate,
                PaymentMode: sMode,
                PaymentStatus: bFull ? "Completed" : "Partial"
            });
            oModel.setProperty("/payments", aPayments);

            // Update invoice status
            var aInvoices = oModel.getProperty("/invoices");
            var idx = aInvoices.findIndex(function (i) { return i.InvoiceId === oInv.InvoiceId; });
            if (idx >= 0) {
                aInvoices[idx].InvoiceStatus = bFull ? "Paid" : "Pending";
                oModel.setProperty("/invoices", aInvoices.slice());
            }

            // Update overdue count in dashboard
            var nOverdue = aInvoices.filter(function (i) { return i.InvoiceStatus === "Overdue"; }).length;
            oModel.setProperty("/dashboard/overdueInvoices", nOverdue);

            this.byId("paymentDialog").close();
            MessageToast.show("Payment of ₹" + nPaid.toLocaleString("en-IN") + " recorded (" + (bFull ? "Full" : "Partial") + ").");
        },

        onCancelPayment: function () {
            this.byId("paymentDialog").close();
        },

        onMarkOverdue: function (oEvent) {
            var oInvoice = oEvent.getSource().getParent().getParent().getBindingContext().getObject();
            var oModel = this.getModel();
            var aInvoices = oModel.getProperty("/invoices");
            var idx = aInvoices.findIndex(function (i) { return i.InvoiceId === oInvoice.InvoiceId; });
            if (idx >= 0) {
                aInvoices[idx].InvoiceStatus = "Overdue";
                oModel.setProperty("/invoices", aInvoices.slice());
                var nOverdue = aInvoices.filter(function (i) { return i.InvoiceStatus === "Overdue"; }).length;
                oModel.setProperty("/dashboard/overdueInvoices", nOverdue);
                MessageToast.show("Invoice " + oInvoice.InvoiceId + " marked as Overdue.");
            }
        },

        onOrderLink: function (oEvent) {
            var sOrderId = oEvent.getSource().getText();
            this.navTo("orderDetail", { orderId: encodeURIComponent(sOrderId) });
        },

        onRefresh: function () { MessageToast.show("Invoices refreshed"); },

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        },

        formatStatusState: function (s) {
            return BaseController.prototype.formatStatusState.call(this, s);
        }
    });
});