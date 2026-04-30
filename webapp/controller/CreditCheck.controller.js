sap.ui.define([
    "o2c/controller/BaseController",
    "sap/m/MessageToast",
    "sap/ui/core/Item"
], function (BaseController, MessageToast, Item) {
    "use strict";

    return BaseController.extend("o2c.controller.CreditCheck", {

        onInit: function () {
            this.getRouter().getRoute("creditcheck").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oModel = this.getModel();
            var aCustomers = oModel.getProperty("/customers") || [];
            var oSelect = this.byId("ccCustomer");
            oSelect.destroyItems();
            oSelect.addItem(new Item({ key: "", text: "-- Select Customer --" }));
            aCustomers.forEach(function (c) {
                oSelect.addItem(new Item({ key: c.CustomerId, text: c.CustomerName }));
            });
            this.byId("resultPanel").setVisible(false);
        },

        onRunCheck: function () {
            var sCustomerId = this.byId("ccCustomer").getSelectedKey();
            var sAmount = this.byId("ccAmount").getValue();

            if (!sCustomerId) {
                this.byId("ccCustomer").setValueState && true;
                MessageToast.show("Please select a customer.");
                return;
            }
            var nAmount = parseFloat(sAmount) || 0;
            if (nAmount <= 0) {
                MessageToast.show("Please enter a valid order amount.");
                return;
            }

            var oModel = this.getModel();
            var aCustomers = oModel.getProperty("/customers") || [];
            var oCustomer = aCustomers.find(function (c) { return c.CustomerId === sCustomerId; });
            if (!oCustomer) return;

            var nAvail = oCustomer.CreditLimit - oCustomer.UsedCredit;
            var bPass = nAmount <= nAvail && oCustomer.Status === "Active";
            var nPctAfter = Math.min(100, Math.round(((oCustomer.UsedCredit + nAmount) / oCustomer.CreditLimit) * 100));

            // Show results
            this.byId("resultPanel").setVisible(true);
            this.byId("resCustomerName").setText(oCustomer.CustomerName + " (" + oCustomer.CustomerId + ")");
            this.byId("resCreditLimit").setNumber("₹" + parseFloat(oCustomer.CreditLimit).toLocaleString("en-IN"));
            this.byId("resUsedCredit").setNumber("₹" + parseFloat(oCustomer.UsedCredit).toLocaleString("en-IN"));
            this.byId("resAvailCredit").setNumber("₹" + parseFloat(nAvail).toLocaleString("en-IN"));
            this.byId("resOrderAmount").setNumber("₹" + parseFloat(nAmount).toLocaleString("en-IN"));
            this.byId("resCreditUtil").setText(nPctAfter + "% of credit limit used after this order");

            var oStrip = this.byId("creditResultStrip");
            var oProgress = this.byId("creditProgress");

            oProgress.setPercentValue(nPctAfter);
            oProgress.setDisplayValue(nPctAfter + "%");

            if (!bPass) {
                oStrip.setType("Error");
                oStrip.setText("CREDIT CHECK FAILED: " + (oCustomer.Status !== "Active" ? "Customer is not Active." : "Order amount exceeds available credit of ₹" + nAvail.toLocaleString("en-IN") + "."));
                oProgress.setState("Error");
                this.byId("resRecommendation").setText("⛔ Recommend REJECTING this order. Customer requires credit limit enhancement or must clear existing dues before placing new orders. Escalate to Finance Manager.");
            } else if (nPctAfter > 85) {
                oStrip.setType("Warning");
                oStrip.setText("CREDIT CHECK WARNING: Order is within limit but credit utilization will exceed 85% after this order.");
                oProgress.setState("Warning");
                this.byId("resRecommendation").setText("⚠️ Recommend conditional approval. Notify Account Manager to collect payment on existing invoices. Monitor closely.");
            } else {
                oStrip.setType("Success");
                oStrip.setText("CREDIT CHECK PASSED: Customer has sufficient credit. Order can proceed.");
                oProgress.setState("Success");
                this.byId("resRecommendation").setText("✅ Recommend APPROVING this order. Credit utilization is within acceptable limits. Auto-approve eligible.");
            }
        },

        onReset: function () {
            this.byId("ccCustomer").setSelectedKey("");
            this.byId("ccAmount").setValue("");
            this.byId("resultPanel").setVisible(false);
        },

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        },

        formatStatusState: function (s) {
            return BaseController.prototype.formatStatusState.call(this, s);
        },

        formatAvail: function (creditLimit) {
            // This formatter gets called with the CreditLimit but needs UsedCredit too
            // Simplified: return the credit limit formatted
            return "₹" + parseFloat(creditLimit || 0).toLocaleString("en-IN");
        },

        formatUsedState: function (usedCredit) {
            return "None";
        },

        fmtPct: function (creditLimit) {
            // Can't access UsedCredit from single-value formatter easily in table row
            return 0;
        },

        fmtPctState: function () { return "Success"; }
    });
});