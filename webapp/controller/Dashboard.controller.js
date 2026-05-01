sap.ui.define([
    "o2c/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("o2c.controller.Dashboard", {

        // ─── Lifecycle ────────────────────────────────────────────────────────────

        onInit: function () {},

        // ─── Order Actions ────────────────────────────────────────────────────────

        onCreateOrder: function () {
            this.navTo("orderCreate");
        },

        onOrderPress: function (oEvent) {
            var oItem = oEvent.getSource().getBindingContext().getObject();
            this.navTo("orderDetail", { orderId: encodeURIComponent(oItem.OrderId) });
        },

        // ─── Navigation ───────────────────────────────────────────────────────────

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
            // Route does not exist yet — safe no-op
            sap.m.MessageToast.show("Reports module coming soon.");
        },

        // ─── Formatters ───────────────────────────────────────────────────────────

        formatCurrency: function (val) {
            return this.getOwnerComponent().getModel() &&
                   BaseController.prototype.formatCurrency.call(this, val);
        }

    });
});