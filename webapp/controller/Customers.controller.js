sap.ui.define([
    "o2c/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("o2c.controller.Customers", {

        // ─── Lifecycle ────────────────────────────────────────────────────────────

        onInit: function () {
            // Fragment instance cached here after first load (lazy init)
            this._oEditDialog = null;
        },

        // ─── Search ───────────────────────────────────────────────────────────────

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
                new Filter("CustomerId",    FilterOperator.Contains, sQuery),
                new Filter("CustomerName",  FilterOperator.Contains, sQuery),
                new Filter("Email",         FilterOperator.Contains, sQuery)
            ];
            oBinding.filter(new Filter({ filters: aFilters, and: false }));
        },

        // ─── Navigation ───────────────────────────────────────────────────────────

        onCreateCustomer: function () {
            this.navTo("customerCreate");
        },

        onCustomerPress: function (oEvent) {
            var oCustomer = oEvent.getSource().getBindingContext().getObject();
            this._openEditDialog(oCustomer);
        },

        onRefresh: function () {
            MessageToast.show("Data refreshed");
        },

        // ─── Edit Dialog ──────────────────────────────────────────────────────────

        /**
         * Opens the CustomerEditDialog fragment.
         * Fragment is loaded lazily on first call and then reused (cached).
         * @param {object} oCustomer - The customer object to edit
         */
        onEditCustomer: function (oEvent) {
            var oCtx = oEvent.getSource().getParent().getParent().getBindingContext();
            var oCustomer = oCtx.getObject();
            this._openEditDialog(oCustomer);
        },

        _openEditDialog: function (oCustomer) {
            // Write a clean copy to /editCustomer so original data is not mutated until Save
            this.getModel().setProperty("/editCustomer", Object.assign({}, oCustomer));

            if (this._oEditDialog) {
                this._oEditDialog.open();
                return;
            }

            // Lazy-load fragment once
            var that = this;
            this.loadFragment({
                name: "o2c.view.fragment.CustomerEditDialog"
            }).then(function (oDialog) {
                that._oEditDialog = oDialog;
                // Register as dependent so model + lifecycle are managed by the view
                that.getView().addDependent(oDialog);
                oDialog.open();
            });
        },

        /**
         * Validates and saves edited customer data back to /customers array.
         */
        onSaveEdit: function () {
            var oModel   = this.getModel();
            var oEdited  = oModel.getProperty("/editCustomer");

            // Basic required-field validation
            if (!oEdited.CustomerName || !oEdited.Email || !oEdited.Phone) {
                MessageBox.error("Please fill all required fields: Customer Name, Email and Phone.");
                return;
            }

            var aCustomers = oModel.getProperty("/customers");
            var idx = aCustomers.findIndex(function (c) {
                return c.CustomerId === oEdited.CustomerId;
            });

            if (idx >= 0) {
                aCustomers[idx] = Object.assign({}, oEdited);
                oModel.setProperty("/customers", aCustomers);
                MessageToast.show("Customer updated successfully!");
                this._oEditDialog.close();
            } else {
                MessageBox.error("Customer not found. Please refresh and try again.");
            }
        },

        /**
         * Closes the dialog without saving. The /editCustomer copy is simply discarded.
         */
        onCancelEdit: function () {
            this._oEditDialog.close();
        },

        // ─── Delete ───────────────────────────────────────────────────────────────

        onDeleteCustomer: function (oEvent) {
            var oCtx     = oEvent.getSource().getParent().getParent().getBindingContext();
            var oCustomer = oCtx.getObject();
            var that     = this;

            MessageBox.confirm(
                "Are you sure you want to delete customer '" + oCustomer.CustomerName + "'?",
                {
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            var oModel     = that.getModel();
                            var aCustomers = oModel.getProperty("/customers");
                            var aUpdated   = aCustomers.filter(function (c) {
                                return c.CustomerId !== oCustomer.CustomerId;
                            });
                            oModel.setProperty("/customers", aUpdated);
                            MessageToast.show("Customer deleted successfully.");
                        }
                    }
                }
            );
        },

        // ─── Formatters ───────────────────────────────────────────────────────────

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        },

        formatStatusState: function (sStatus) {
            return BaseController.prototype.formatStatusState.call(this, sStatus);
        },

        formatCreditState: function (usedCredit) {
            return "None";
        },

        // Credit utilization formatters used by the fragment's ProgressIndicator
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