sap.ui.define([
    "o2c/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("o2c.controller.Approvals", {

        _selectedApproval: null,

        onFilterChange: function () {
            var sKey = this.byId("approvalFilter").getSelectedKey();
            var oBinding = this.byId("approvalsTable").getBinding("items");
            if (sKey === "All") {
                oBinding.filter([]);
            } else {
                oBinding.filter(new Filter("Decision", FilterOperator.EQ, sKey));
            }
        },

        onApprovalSelect: function (oEvent) {
            var bSelected = oEvent.getParameter("selected");
            this.byId("btnBulkApprove").setEnabled(bSelected);
        },

        onApprove: function (oEvent) {
            var oCtx = oEvent.getSource().getParent().getParent().getBindingContext();
            this._selectedApproval = oCtx.getObject();
            this.byId("dlgOrderId").setText(this._selectedApproval.OrderId);
            this.byId("dlgDecision").setSelectedKey("Approved");
            this.byId("dlgRemarks").setValue("");
            this.byId("approvalDialog").open();
        },

        onReject: function (oEvent) {
            var oCtx = oEvent.getSource().getParent().getParent().getBindingContext();
            this._selectedApproval = oCtx.getObject();
            this.byId("dlgOrderId").setText(this._selectedApproval.OrderId);
            this.byId("dlgDecision").setSelectedKey("Rejected");
            this.byId("dlgRemarks").setValue("");
            this.byId("approvalDialog").open();
        },

        onApprovalPress: function (oEvent) {
            var oApproval = oEvent.getSource().getBindingContext().getObject();
            if (oApproval.Decision === "Pending") {
                this._selectedApproval = oApproval;
                this.byId("dlgOrderId").setText(oApproval.OrderId);
                this.byId("dlgDecision").setSelectedKey("Approved");
                this.byId("dlgRemarks").setValue("");
                this.byId("approvalDialog").open();
            }
        },

        onSubmitDecision: function () {
            var sDecision = this.byId("dlgDecision").getSelectedKey();
            var sRemarks = this.byId("dlgRemarks").getValue();

            if (!sRemarks) {
                MessageBox.error("Remarks are mandatory for approval decisions.");
                return;
            }

            var oModel = this.getModel();
            var oUser = oModel.getProperty("/currentUser");

            // Update approval
            var aApprovals = oModel.getProperty("/approvals") || [];
            var idx = aApprovals.findIndex(function (a) { return a.ApprovalId === this._selectedApproval.ApprovalId; }, this);
            if (idx >= 0) {
                aApprovals[idx].Decision = sDecision;
                aApprovals[idx].Remarks = sRemarks;
                aApprovals[idx].ApprovedBy = oUser.name;
                aApprovals[idx].ApprovedOn = this.getToday();
                oModel.setProperty("/approvals", aApprovals.slice());
            }

            // Update order credit status
            var aOrders = oModel.getProperty("/orders") || [];
            var oIdx = aOrders.findIndex(function (o) { return o.OrderId === this._selectedApproval.OrderId; }, this);
            if (oIdx >= 0) {
                aOrders[oIdx].CreditStatus = sDecision;
                if (sDecision === "Approved") {
                    aOrders[oIdx].OrderStatus = "Processing";
                } else {
                    aOrders[oIdx].OrderStatus = "Cancelled";
                }
                oModel.setProperty("/orders", aOrders.slice());
            }

            // Update dashboard pending count
            var nPending = aApprovals.filter(function (a) { return a.Decision === "Pending"; }).length;
            oModel.setProperty("/dashboard/pendingApprovals", nPending);

            this.byId("approvalDialog").close();
            MessageToast.show("Decision recorded: " + sDecision + " for " + this._selectedApproval.OrderId);
            this._selectedApproval = null;
        },

        onCancelDecision: function () {
            this.byId("approvalDialog").close();
        },

        onBulkApprove: function () {
            MessageBox.confirm("Approve all selected pending orders?", {
                onClose: function (sAction) {
                    if (sAction === "OK") {
                        MessageToast.show("Bulk approval submitted.");
                    }
                }
            });
        },

        onOrderLink: function (oEvent) {
            var sOrderId = oEvent.getSource().getText();
            this.navTo("orderDetail", { orderId: encodeURIComponent(sOrderId) });
        },

        formatStatusState: function (s) {
            return BaseController.prototype.formatStatusState.call(this, s);
        }
    });
});