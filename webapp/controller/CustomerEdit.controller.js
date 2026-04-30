sap.ui.define([
    "o2c/controller/BaseController",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("o2c.controller.CustomerEdit", {

        onInit: function () {
            this.getRouter().getRoute("customerEdit").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sId = decodeURIComponent(oEvent.getParameter("arguments").customerId);
            var oModel = this.getModel();
            var aCustomers = oModel.getProperty("/customers") || [];
            var oCustomer = aCustomers.find(function (c) { return c.CustomerId === sId; });
            if (oCustomer) {
                oModel.setProperty("/editCustomer", Object.assign({}, oCustomer));
            }
        },

        onSave: function () {
            var oModel = this.getModel();
            var oEdited = oModel.getProperty("/editCustomer");

            // Basic validation
            if (!oEdited.CustomerName || !oEdited.Email || !oEdited.Phone) {
                MessageBox.error("Please fill all required fields.");
                return;
            }

            var aCustomers = oModel.getProperty("/customers");
            var idx = aCustomers.findIndex(function (c) { return c.CustomerId === oEdited.CustomerId; });
            if (idx >= 0) {
                aCustomers[idx] = Object.assign({}, oEdited);
                oModel.setProperty("/customers", aCustomers);
                MessageToast.show("Customer updated successfully!");
                this.navTo("customers");
            }
        },

        calcCreditPercent: function (oCustomer) {
            if (!oCustomer || !oCustomer.CreditLimit) return 0;
            return Math.min(100, Math.round((oCustomer.UsedCredit / oCustomer.CreditLimit) * 100));
        },

        calcCreditPercentText: function (oCustomer) {
            return this.calcCreditPercent(oCustomer) + "%";
        },

        calcCreditState: function (oCustomer) {
            var pct = this.calcCreditPercent(oCustomer);
            if (pct >= 90) return "Error";
            if (pct >= 70) return "Warning";
            return "Success";
        }
    });
});