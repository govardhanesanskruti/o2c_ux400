sap.ui.define([
    "o2c/controller/BaseController",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("o2c.controller.CustomerCreate", {

        onInit: function () {
            this.getRouter().getRoute("customerCreate").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oModel = this.getModel();
            // Reset form
            oModel.setProperty("/newCustomer", {
                CustomerId: this._genId(oModel),
                CustomerName: "", Email: "", Phone: "",
                Address: "", CreditLimit: 0, UsedCredit: 0, Status: "Active"
            });
            this._clearValueStates();
        },

        _genId: function (oModel) {
            var aList = oModel.getProperty("/customers") || [];
            var max = 0;
            aList.forEach(function (c) {
                var n = parseInt(c.CustomerId.replace("C", ""), 10);
                if (n > max) max = n;
            });
            return "C" + String(max + 1).padStart(3, "0");
        },

        _clearValueStates: function () {
            ["customerId","customerName","customerEmail","customerPhone",
             "customerAddress","customerCreditLimit"].forEach(function (id) {
                var ctrl = this.byId(id);
                if (ctrl && ctrl.setValueState) {
                    ctrl.setValueState("None");
                    ctrl.setValueStateText("");
                }
            }, this);
        },

        onSave: function () {
            if (!this._validate()) return;

            var oModel = this.getModel();
            var oNew = Object.assign({}, oModel.getProperty("/newCustomer"));
            oNew.CreditLimit = parseFloat(oNew.CreditLimit) || 0;
            oNew.UsedCredit = 0;

            var aCustomers = oModel.getProperty("/customers") || [];
            aCustomers.push(oNew);
            oModel.setProperty("/customers", aCustomers);

            MessageToast.show("Customer '" + oNew.CustomerName + "' created successfully!");
            this.navTo("customers");
        },

        _validate: function () {
            var isValid = true;
            var oModel = this.getModel();
            var oData = oModel.getProperty("/newCustomer");

            var rules = [
                { id: "customerName", val: oData.CustomerName, msg: "Customer Name is required" },
                { id: "customerEmail", val: oData.Email, msg: "Email is required", emailCheck: true },
                { id: "customerPhone", val: oData.Phone, msg: "Phone is required" },
                { id: "customerAddress", val: oData.Address, msg: "Address is required" },
                { id: "customerCreditLimit", val: oData.CreditLimit, msg: "Credit Limit must be > 0", numCheck: true }
            ];

            rules.forEach(function (rule) {
                var ctrl = this.byId(rule.id);
                if (!ctrl) return;
                var val = (oData[rule.val] !== undefined ? oData[rule.val] : rule.val);

                if (!val || val === "" || val === 0 || val === "0") {
                    ctrl.setValueState("Error");
                    ctrl.setValueStateText(rule.msg);
                    isValid = false;
                } else if (rule.emailCheck && !this.validateEmail(String(val))) {
                    ctrl.setValueState("Error");
                    ctrl.setValueStateText("Enter a valid email address");
                    isValid = false;
                } else if (rule.numCheck && parseFloat(val) <= 0) {
                    ctrl.setValueState("Error");
                    ctrl.setValueStateText("Credit limit must be greater than 0");
                    isValid = false;
                } else {
                    ctrl.setValueState("None");
                }
            }, this);

            // Re-read direct values
            var nm = this.byId("customerName").getValue();
            var em = this.byId("customerEmail").getValue();
            var ph = this.byId("customerPhone").getValue();
            var ad = this.byId("customerAddress").getValue();
            var cl = this.byId("customerCreditLimit").getValue();

            oModel.setProperty("/newCustomer/CustomerName", nm);
            oModel.setProperty("/newCustomer/Email", em);
            oModel.setProperty("/newCustomer/Phone", ph);
            oModel.setProperty("/newCustomer/Address", ad);
            oModel.setProperty("/newCustomer/CreditLimit", parseFloat(cl) || 0);

            if (!nm) { this.byId("customerName").setValueState("Error"); isValid = false; }
            if (!em || !this.validateEmail(em)) { this.byId("customerEmail").setValueState("Error"); isValid = false; }
            if (!ph) { this.byId("customerPhone").setValueState("Error"); isValid = false; }
            if (!ad) { this.byId("customerAddress").setValueState("Error"); isValid = false; }
            if (!cl || parseFloat(cl) <= 0) { this.byId("customerCreditLimit").setValueState("Error"); isValid = false; }

            if (!isValid) {
                MessageBox.error("Please correct the validation errors before saving.");
            }
            return isValid;
        }
    });
});