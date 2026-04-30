sap.ui.define([
    "o2c/controller/BaseController",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("o2c.controller.OrderDetail", {

        onInit: function () {
            this.getRouter().getRoute("orderDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sOrderId = decodeURIComponent(oEvent.getParameter("arguments").orderId);
            var oModel = this.getModel();

            var aOrders = oModel.getProperty("/orders") || [];
            var oOrder = aOrders.find(function (o) { return o.OrderId === sOrderId; });
            oModel.setProperty("/selectedOrder", oOrder || {});

            var aItems = (oModel.getProperty("/orderItems") || []).filter(function (i) { return i.OrderId === sOrderId; });
            oModel.setProperty("/selectedOrderItems", aItems);

            var aApprovals = (oModel.getProperty("/approvals") || []).filter(function (a) { return a.OrderId === sOrderId; });
            oModel.setProperty("/selectedApproval", aApprovals);
        },

        onGenerateInvoice: function () {
            var oModel = this.getModel();
            var oOrder = oModel.getProperty("/selectedOrder");
            if (!oOrder) return;

            // Check if invoice already exists
            var aInvoices = oModel.getProperty("/invoices") || [];
            var exists = aInvoices.find(function (i) { return i.OrderId === oOrder.OrderId; });
            if (exists) {
                MessageBox.information("Invoice " + exists.InvoiceId + " already exists for this order.");
                return;
            }

            var max = 0;
            aInvoices.forEach(function (inv) {
                var n = parseInt(inv.InvoiceId.replace(/\D/g, ""), 10);
                if (n > max) max = n;
            });
            var sInvId = "INV-2024-" + String(max + 1).padStart(3, "0");
            var today = this.getToday();
            var dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            var sDue = dueDate.toISOString().split("T")[0];

            aInvoices.push({
                InvoiceId: sInvId,
                OrderId: oOrder.OrderId,
                InvoiceDate: today,
                Amount: oOrder.TotalAmount,
                DueDate: sDue,
                InvoiceStatus: "Pending"
            });
            oModel.setProperty("/invoices", aInvoices);
            MessageToast.show("Invoice " + sInvId + " generated successfully! Due: " + sDue);
        },

        onUpdateStatus: function () {
            this.byId("updateStatusDialog").open();
        },

        onConfirmStatusUpdate: function () {
            var sStatus = this.byId("newStatusSelect").getSelectedKey();
            var sRemarks = this.byId("statusRemarks").getValue();
            var oModel = this.getModel();
            var oOrder = oModel.getProperty("/selectedOrder");

            var aOrders = oModel.getProperty("/orders") || [];
            var idx = aOrders.findIndex(function (o) { return o.OrderId === oOrder.OrderId; });
            if (idx >= 0) {
                aOrders[idx].OrderStatus = sStatus;
                oModel.setProperty("/orders", aOrders.slice());
                oModel.setProperty("/selectedOrder/OrderStatus", sStatus);
            }

            this.byId("updateStatusDialog").close();
            MessageToast.show("Order status updated to: " + sStatus);
        },

        onCancelStatusUpdate: function () {
            this.byId("updateStatusDialog").close();
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