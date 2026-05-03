sap.ui.define([
    "o2c/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, MessageToast) {
    "use strict";

    return BaseController.extend("o2c.controller.Payments", {

        // ─── Filter ───────────────────────────────────────────────────────────────

        onFilterChange: function () {
            var sStatus  = this.byId("payStatusFilter").getSelectedKey();
            var sMode    = this.byId("payModeFilter").getSelectedKey();
            var oBinding = this.byId("paymentsTable").getBinding("items");
            var aFilters = [];
            if (sStatus !== "All") aFilters.push(new Filter("PaymentStatus", FilterOperator.EQ, sStatus));
            if (sMode   !== "All") aFilters.push(new Filter("PaymentMode",   FilterOperator.EQ, sMode));
            oBinding.filter(aFilters);
        },

        // ─── Receipt Dialog ───────────────────────────────────────────────────────

        onViewReceipt: function (oEvent) {
            var oPayment = oEvent.getSource().getParent().getParent().getBindingContext().getObject();
            this.byId("rcptPayId").setText(oPayment.PaymentId);
            this.byId("rcptInvId").setText(oPayment.InvoiceId);
            this.byId("rcptAmt").setText("₹" + parseFloat(oPayment.AmountPaid).toLocaleString("en-IN"));
            this.byId("rcptDate").setText(oPayment.PaymentDate);
            this.byId("rcptMode").setText(oPayment.PaymentMode);
            this.byId("rcptStatus").setText(oPayment.PaymentStatus);
            this.byId("rcptStatus").setState(
                oPayment.PaymentStatus === "Completed" ? "Success" :
                oPayment.PaymentStatus === "Partial"   ? "Warning" : "None"
            );
            this.byId("receiptDialog").open();
        },

        onCloseReceipt: function () {
            this.byId("receiptDialog").close();
        },

        // ─── Links / Export ───────────────────────────────────────────────────────

        onInvoiceLink: function () {
            this.navTo("invoices");
        },

        onExport: function () {
            MessageToast.show("Export to Excel — integrate sap.ui.export for production.");
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
         * Total collected in Lakhs for scale="L" NumericContent.
         * Replaces: {= Math.round(${/payments}.reduce(...)/100000)}
         */
        calcTotalCollected: function (aPayments) {
            if (!aPayments || !aPayments.length) return 0;
            var total = aPayments.reduce(function (s, p) { return s + (p.AmountPaid || 0); }, 0);
            return Math.round(total / 100000);
        },

        /**
         * Count of Completed payments.
         * Replaces: {= ${/payments}.filter(function(p){return p.PaymentStatus==='Completed';}).length}
         */
        calcCompletedCount: function (aPayments) {
            if (!aPayments) return 0;
            return aPayments.filter(function (p) { return p.PaymentStatus === "Completed"; }).length;
        },

        /**
         * Count of Partial payments.
         * Replaces: {= ${/payments}.filter(function(p){return p.PaymentStatus==='Partial';}).length}
         */
        calcPartialCount: function (aPayments) {
            if (!aPayments) return 0;
            return aPayments.filter(function (p) { return p.PaymentStatus === "Partial"; }).length;
        }

    });
});