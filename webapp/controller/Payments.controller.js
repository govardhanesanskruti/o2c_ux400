sap.ui.define([
    "o2c/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, MessageToast) {
    "use strict";

    return BaseController.extend("o2c.controller.Payments", {

        onFilterChange: function () {
            var sStatus = this.byId("payStatusFilter").getSelectedKey();
            var sMode = this.byId("payModeFilter").getSelectedKey();
            var oBinding = this.byId("paymentsTable").getBinding("items");
            var aFilters = [];
            if (sStatus !== "All") aFilters.push(new Filter("PaymentStatus", FilterOperator.EQ, sStatus));
            if (sMode !== "All") aFilters.push(new Filter("PaymentMode", FilterOperator.EQ, sMode));
            oBinding.filter(aFilters);
        },

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
                oPayment.PaymentStatus === "Partial" ? "Warning" : "None"
            );
            this.byId("receiptDialog").open();
        },

        onCloseReceipt: function () {
            this.byId("receiptDialog").close();
        },

        onInvoiceLink: function (oEvent) {
            this.navTo("invoices");
        },

        onExport: function () {
            MessageToast.show("Export to Excel functionality - integrate sap.ui.export for production.");
        },

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        },

        formatStatusState: function (s) {
            return BaseController.prototype.formatStatusState.call(this, s);
        },
        getTotalPayments: function (payments) {
            if (!payments) return 0;

            const total = payments.reduce((s, p) => s + p.AmountPaid, 0);
            return Math.round(total / 100000);
        }
    });
});