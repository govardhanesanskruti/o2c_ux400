sap.ui.define([
    "o2c/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("o2c.controller.Orders", {

        onSearch: function (oEvent) {
            var sQ = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            var sStatus = this.byId("statusFilter").getSelectedKey();
            this._filter(sQ, sStatus);
        },

        onStatusFilter: function () {
            var sStatus = this.byId("statusFilter").getSelectedKey();
            this._filter("", sStatus);
        },

        _filter: function (sQ, sStatus) {
            var oBinding = this.byId("ordersTable").getBinding("items");
            var aFilters = [];
            if (sQ) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("OrderId", FilterOperator.Contains, sQ),
                        new Filter("CustomerName", FilterOperator.Contains, sQ)
                    ], and: false
                }));
            }
            if (sStatus && sStatus !== "All") {
                aFilters.push(new Filter("OrderStatus", FilterOperator.EQ, sStatus));
            }
            oBinding.filter(aFilters);
        },

        onCreateOrder: function () {
            this.navTo("orderCreate");
        },

        onOrderPress: function (oEvent) {
            var oOrder = oEvent.getSource().getBindingContext().getObject();
            this.navTo("orderDetail", { orderId: encodeURIComponent(oOrder.OrderId) });
        },

        onViewDetail: function (oEvent) {
            var oOrder = oEvent.getSource().getParent().getParent().getBindingContext().getObject();
            this.navTo("orderDetail", { orderId: encodeURIComponent(oOrder.OrderId) });
        },

        onCancelOrder: function (oEvent) {
            var oOrder = oEvent.getSource().getParent().getParent().getBindingContext().getObject();
            var that = this;
            if (oOrder.OrderStatus === "Delivered" || oOrder.OrderStatus === "Shipped") {
                MessageBox.error("Cannot cancel an order that is already " + oOrder.OrderStatus + ".");
                return;
            }
            MessageBox.confirm("Cancel order " + oOrder.OrderId + "?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = that.getModel();
                        var aOrders = oModel.getProperty("/orders");
                        var idx = aOrders.findIndex(function (o) { return o.OrderId === oOrder.OrderId; });
                        if (idx >= 0) {
                            aOrders[idx].OrderStatus = "Cancelled";
                            aOrders[idx].CreditStatus = "Rejected";
                            oModel.setProperty("/orders", aOrders.slice());
                            MessageToast.show("Order " + oOrder.OrderId + " cancelled.");
                        }
                    }
                }
            });
        },

        onRefresh: function () {
            MessageToast.show("Orders refreshed");
        },

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        },

        formatStatusState: function (s) {
            return BaseController.prototype.formatStatusState.call(this, s);
        }
    });
});