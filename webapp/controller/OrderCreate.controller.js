sap.ui.define([
    "o2c/controller/BaseController",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Item"
], function (BaseController, MessageToast, MessageBox, Item) {
    "use strict";

    return BaseController.extend("o2c.controller.OrderCreate", {

        onInit: function () {
            this.getRouter().getRoute("orderCreate").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oModel = this.getModel();
            var aOrders = oModel.getProperty("/orders") || [];
            var max = 0;
            aOrders.forEach(function (o) {
                var n = parseInt(o.OrderId.replace(/\D/g, ""), 10);
                if (n > max) max = n;
            });
            var sNewId = "ORD-2024-" + String(max + 1).padStart(3, "0");

            oModel.setProperty("/newOrder", {
                OrderId: sNewId,
                CustomerId: "",
                CustomerName: "",
                OrderDate: this.getToday(),
                TotalAmount: 0,
                CreditStatus: "Pending",
                OrderStatus: "Draft",
                items: [],
                _creditLimit: "₹0",
                _usedCredit: "₹0",
                _availCredit: "₹0"
            });

            // Bind customer select items
            var oSelect = this.byId("orderCustomer");
            oSelect.destroyItems();
            oSelect.addItem(new Item({ key: "", text: "-- Select Customer --" }));
            var aCustomers = oModel.getProperty("/customers") || [];
            aCustomers.forEach(function (c) {
                oSelect.addItem(new Item({ key: c.CustomerId, text: c.CustomerName + " (" + c.CustomerId + ")" }));
            });

            this.byId("creditInfoPanel").setVisible(false);
        },

        onCustomerChange: function (oEvent) {
            var sKey = oEvent.getSource().getSelectedKey();
            if (!sKey) return;
            var oModel = this.getModel();
            var aCustomers = oModel.getProperty("/customers") || [];
            var oCustomer = aCustomers.find(function (c) { return c.CustomerId === sKey; });
            if (oCustomer) {
                oModel.setProperty("/newOrder/CustomerId", oCustomer.CustomerId);
                oModel.setProperty("/newOrder/CustomerName", oCustomer.CustomerName);
                var avail = oCustomer.CreditLimit - oCustomer.UsedCredit;
                oModel.setProperty("/newOrder/_creditLimit", "₹" + parseFloat(oCustomer.CreditLimit).toLocaleString("en-IN"));
                oModel.setProperty("/newOrder/_usedCredit", "₹" + parseFloat(oCustomer.UsedCredit).toLocaleString("en-IN"));
                oModel.setProperty("/newOrder/_availCredit", "₹" + parseFloat(avail).toLocaleString("en-IN"));
                this.byId("creditInfoPanel").setVisible(true);
            }
        },

        onAddItem: function () {
            var oModel = this.getModel();
            var aProducts = oModel.getProperty("/products") || [];

            var oProductSelect = this.byId("itemProduct");
            oProductSelect.destroyItems();
            oProductSelect.addItem(new Item({ key: "", text: "-- Select Product --" }));
            aProducts.forEach(function (p) {
                if (p.Stock > 0) {
                    oProductSelect.addItem(new Item({ key: p.ProductId, text: p.ProductName + " (" + p.ProductId + ")" }));
                }
            });

            this.byId("itemUnitPrice").setValue("");
            this.byId("itemQty").setValue("");
            this.byId("itemTotal").setValue("");
            this.byId("itemStock").setText("-");
            this.byId("addItemDialog").open();
        },

        onProductSelect: function (oEvent) {
            var sKey = oEvent.getSource().getSelectedKey();
            if (!sKey) return;
            var oModel = this.getModel();
            var aProducts = oModel.getProperty("/products") || [];
            var oProduct = aProducts.find(function (p) { return p.ProductId === sKey; });
            if (oProduct) {
                this.byId("itemUnitPrice").setValue(oProduct.Price);
                this.byId("itemStock").setText(oProduct.Stock + " units available");
                this._selectedProduct = oProduct;
                this._recalcItemTotal();
            }
        },

        onItemQtyChange: function () {
            this._recalcItemTotal();
        },

        _recalcItemTotal: function () {
            var nPrice = parseFloat(this.byId("itemUnitPrice").getValue()) || 0;
            var nQty = parseFloat(this.byId("itemQty").getValue()) || 0;
            this.byId("itemTotal").setValue((nPrice * nQty).toLocaleString("en-IN"));
        },

        onConfirmAddItem: function () {
            if (!this._selectedProduct) {
                MessageBox.error("Please select a product.");
                return;
            }
            var nQty = parseInt(this.byId("itemQty").getValue()) || 0;
            if (nQty <= 0) {
                MessageBox.error("Quantity must be greater than 0.");
                return;
            }
            if (nQty > this._selectedProduct.Stock) {
                MessageBox.error("Quantity exceeds available stock (" + this._selectedProduct.Stock + " units).");
                return;
            }

            var oModel = this.getModel();
            var aItems = oModel.getProperty("/newOrder/items") || [];

            // Check if product already in list
            var existing = aItems.find(function (i) { return i.ProductId === this._selectedProduct.ProductId; }, this);
            if (existing) {
                existing.Quantity += nQty;
                existing.ItemTotal = existing.Quantity * existing.UnitPrice;
            } else {
                var nTotal = nQty * this._selectedProduct.Price;
                aItems.push({
                    ItemId: "ITM-" + String(aItems.length + 1).padStart(3, "0"),
                    OrderId: oModel.getProperty("/newOrder/OrderId"),
                    ProductId: this._selectedProduct.ProductId,
                    ProductName: this._selectedProduct.ProductName,
                    Quantity: nQty,
                    UnitPrice: this._selectedProduct.Price,
                    ItemTotal: nTotal
                });
            }

            oModel.setProperty("/newOrder/items", aItems);
            this._recalcOrderTotal(oModel, aItems);
            this.byId("addItemDialog").close();
            this._selectedProduct = null;
        },

        onCancelAddItem: function () {
            this.byId("addItemDialog").close();
        },

        onQtyChange: function (oEvent) {
            var oInput = oEvent.getSource();
            var oCtx = oInput.getBindingContext();
            var nQty = parseInt(oInput.getValue()) || 0;
            var oModel = this.getModel();
            var sPath = oCtx.getPath();
            var oItem = oCtx.getObject();
            oItem.Quantity = nQty;
            oItem.ItemTotal = nQty * oItem.UnitPrice;
            oModel.setProperty(sPath, oItem);
            var aItems = oModel.getProperty("/newOrder/items");
            this._recalcOrderTotal(oModel, aItems);
        },

        onRemoveItem: function (oEvent) {
            var oCtx = oEvent.getSource().getParent().getParent().getBindingContext();
            var oItem = oCtx.getObject();
            var oModel = this.getModel();
            var aItems = oModel.getProperty("/newOrder/items");
            aItems = aItems.filter(function (i) { return i.ItemId !== oItem.ItemId; });
            oModel.setProperty("/newOrder/items", aItems);
            this._recalcOrderTotal(oModel, aItems);
        },

        _recalcOrderTotal: function (oModel, aItems) {
            var nTotal = aItems.reduce(function (sum, i) { return sum + (i.ItemTotal || 0); }, 0);
            oModel.setProperty("/newOrder/TotalAmount", nTotal);
        },

        onSaveOrder: function () {
            var oModel = this.getModel();
            var oOrder = oModel.getProperty("/newOrder");

            if (!oOrder.CustomerId) {
                MessageBox.error("Please select a customer.");
                return;
            }
            if (!oOrder.OrderDate) {
                MessageBox.error("Please select an order date.");
                return;
            }
            if (!oOrder.items || oOrder.items.length === 0) {
                MessageBox.error("Please add at least one item to the order.");
                return;
            }

            // Credit check
            var aCustomers = oModel.getProperty("/customers") || [];
            var oCustomer = aCustomers.find(function (c) { return c.CustomerId === oOrder.CustomerId; });
            var bCreditOk = oCustomer && (oCustomer.CreditLimit - oCustomer.UsedCredit) >= oOrder.TotalAmount;

            var oNewOrder = {
                OrderId: oOrder.OrderId,
                CustomerId: oOrder.CustomerId,
                CustomerName: oOrder.CustomerName,
                OrderDate: oOrder.OrderDate,
                TotalAmount: oOrder.TotalAmount,
                CreditStatus: bCreditOk ? "Pending" : "Rejected",
                OrderStatus: bCreditOk ? "Pending Approval" : "Cancelled"
            };

            // Add order items
            var aOrderItems = oModel.getProperty("/orderItems") || [];
            oOrder.items.forEach(function (item) {
                aOrderItems.push(Object.assign({}, item, { OrderId: oOrder.OrderId }));
            });
            oModel.setProperty("/orderItems", aOrderItems);

            // Add approval record
            var aApprovals = oModel.getProperty("/approvals") || [];
            var nApprMax = 0;
            aApprovals.forEach(function (a) { var n = parseInt(a.ApprovalId.replace(/\D/g, ""), 10); if (n > nApprMax) nApprMax = n; });
            aApprovals.push({
                ApprovalId: "APR-" + String(nApprMax + 1).padStart(3, "0"),
                OrderId: oOrder.OrderId,
                Decision: bCreditOk ? "Pending" : "Rejected",
                Remarks: bCreditOk ? "Awaiting credit manager review." : "Auto-rejected: credit limit exceeded.",
                ApprovedBy: bCreditOk ? "-" : "System",
                ApprovedOn: bCreditOk ? "-" : this.getToday()
            });
            oModel.setProperty("/approvals", aApprovals);

            // Add to orders list
            var aOrders = oModel.getProperty("/orders") || [];
            aOrders.push(oNewOrder);
            oModel.setProperty("/orders", aOrders);

            // Update dashboard
            oModel.setProperty("/dashboard/totalOrders", aOrders.length);
            var nPending = aApprovals.filter(function (a) { return a.Decision === "Pending"; }).length;
            oModel.setProperty("/dashboard/pendingApprovals", nPending);

            if (bCreditOk) {
                MessageToast.show("Order " + oOrder.OrderId + " created successfully! Sent for approval.");
            } else {
                MessageBox.warning("Order " + oOrder.OrderId + " created but REJECTED - Customer credit limit exceeded.");
            }
            this.navTo("orders");
        },

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        }
    });
});