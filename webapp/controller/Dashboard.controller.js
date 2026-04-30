sap.ui.define([
    "o2c/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("o2c.controller.Dashboard", {

        onInit: function () {},
        
        onNavDashboard: function () {
            this.navTo("dashboard");
        },

        onNavCustomers: function () {
            this.navTo("customers");
        },

        onNavProducts: function () {
            this.navTo("products");
        },

        onNavOrders: function () {
            this.navTo("orders");
        },

        onNavCreditCheck: function () {
            this.navTo("creditcheck");
        },

        onNavApprovals: function () {
            this.navTo("approvals");
        },

        onNavInvoices: function () {
            this.navTo("invoices");
        },

        onNavPayments: function () {
            this.navTo("payments");
        },

        onNavReports: function () {
            this.navTo("reports");
        },

        onCreateOrder: function () {
            this.navTo("orderCreate");
        },

        onOrderPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            if (!oContext) {
                return;
            }

            var oItem = oContext.getObject();
            this.navTo("orderDetail", {
                orderId: encodeURIComponent(oItem.OrderId || oItem.orderId)
            });
        },

        formatCurrency: function (val) {
            return this.getOwnerComponent().getModel() &&
                BaseController.prototype.formatCurrency.call(this, val);
        }
    });
});