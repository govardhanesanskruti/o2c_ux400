sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, History, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("o2c.controller.BaseController", {

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        getModel: function (sName) {
            return this.getView().getModel(sName) || this.getOwnerComponent().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        navTo: function (sRoute, oParams) {
            this.getRouter().navTo(sRoute, oParams || {});
        },

        navBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.navTo("dashboard");
            }
        },

        showMessage: function (sMsg, sType) {
            if (sType === "error") {
                MessageBox.error(sMsg);
            } else if (sType === "success") {
                MessageToast.show(sMsg, { duration: 3000 });
            } else {
                MessageToast.show(sMsg);
            }
        },

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        },

        formatStatusState: function (sStatus) {
            var mMap = {
                "Active": "Success", "Approved": "Success", "Paid": "Success",
                "Delivered": "Success", "Completed": "Success", "Available": "Success",
                "Pending": "Warning", "Pending Approval": "Warning", "Partial": "Warning",
                "Processing": "Information", "Shipped": "Information", "Low Stock": "Warning",
                "On Hold": "Warning", "Rejected": "Error", "Cancelled": "Error",
                "Overdue": "Error", "Out of Stock": "Error"
            };
            return mMap[sStatus] || "None";
        },

        generateId: function (prefix, list) {
            var max = 0;
            list.forEach(function (item) {
                var num = parseInt((item[Object.keys(item)[0]] || "").replace(/\D/g, ""), 10);
                if (!isNaN(num) && num > max) max = num;
            });
            return prefix + String(max + 1).padStart(3, "0");
        },

        getToday: function () {
            return new Date().toISOString().split("T")[0];
        },

        validateEmail: function (email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },

        validatePhone: function (phone) {
            return /^[+]?[\d\s\-]{8,15}$/.test(phone);
        },

        onNavDashboard: function () { this.navTo("dashboard"); },
        onNavCustomers: function () { this.navTo("customers"); },
        onNavProducts: function () { this.navTo("products"); },
        onNavOrders: function () { this.navTo("orders"); },
        onNavCreditCheck: function () { this.navTo("creditcheck"); },
        onNavApprovals: function () { this.navTo("approvals"); },
        onNavInvoices: function () { this.navTo("invoices"); },
        onNavPayments: function () { this.navTo("payments"); },
        onNavReports: function () { this.navTo("reports"); }
    });
});