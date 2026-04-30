sap.ui.define([
    "o2c/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("o2c.controller.Customers", {

        onInit: function () {},

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            var oTable = this.byId("customerTable");
            var oBinding = oTable.getBinding("items");
            if (!oBinding) return;
            if (!sQuery) {
                oBinding.filter([]);
                return;
            }
            var aFilters = [
                new Filter("CustomerId", FilterOperator.Contains, sQuery),
                new Filter("CustomerName", FilterOperator.Contains, sQuery),
                new Filter("Email", FilterOperator.Contains, sQuery)
            ];
            oBinding.filter(new Filter({ filters: aFilters, and: false }));
        },

        onCreateCustomer: function () {
            this.navTo("customerCreate");
        },

        onEditCustomer: function (oEvent) {
            var oCtx = oEvent.getSource().getParent().getParent().getBindingContext();
            var oCustomer = oCtx.getObject();
            // Store selected customer for edit
            this.getModel().setProperty("/editCustomer", Object.assign({}, oCustomer));
            this.navTo("customerEdit", { customerId: encodeURIComponent(oCustomer.CustomerId) });
        },

        onDeleteCustomer: function (oEvent) {
            var oCtx = oEvent.getSource().getParent().getParent().getBindingContext();
            var oCustomer = oCtx.getObject();
            var that = this;
            MessageBox.confirm("Are you sure you want to delete customer '" + oCustomer.CustomerName + "'?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = that.getModel();
                        var aCustomers = oModel.getProperty("/customers");
                        var aUpdated = aCustomers.filter(function (c) { return c.CustomerId !== oCustomer.CustomerId; });
                        oModel.setProperty("/customers", aUpdated);
                        MessageToast.show("Customer deleted successfully");
                    }
                }
            });
        },

        onCustomerPress: function (oEvent) {
            // Navigate to edit
            var oCustomer = oEvent.getSource().getBindingContext().getObject();
            this.getModel().setProperty("/editCustomer", Object.assign({}, oCustomer));
            this.navTo("customerEdit", { customerId: encodeURIComponent(oCustomer.CustomerId) });
        },

        onRefresh: function () {
            MessageToast.show("Data refreshed");
        },

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        },

        formatStatusState: function (sStatus) {
            return BaseController.prototype.formatStatusState.call(this, sStatus);
        },

        formatCreditState: function (usedCredit) {
            // will highlight if near limit — simplified here
            return "None";
        }
    });
});