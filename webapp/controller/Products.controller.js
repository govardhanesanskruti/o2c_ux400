sap.ui.define([
    "o2c/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (BaseController, Filter, FilterOperator, Fragment, MessageToast, MessageBox) {
    "use strict";

    return BaseController.extend("o2c.controller.Products", {

        onSearch: function (oEvent) {
            var sQ = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            var sCategory = this.byId("categoryFilter").getSelectedKey();
            this._applyFilters(sQ, sCategory);
        },

        onCategoryFilter: function () {
            var sQ = "";
            var sCategory = this.byId("categoryFilter").getSelectedKey();
            this._applyFilters(sQ, sCategory);
        },

        _applyFilters: function (sQ, sCategory) {
            var oBinding = this.byId("productTable").getBinding("items");
            var aFilters = [];
            if (sQ) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("ProductName", FilterOperator.Contains, sQ),
                        new Filter("ProductId", FilterOperator.Contains, sQ)
                    ], and: false
                }));
            }
            if (sCategory && sCategory !== "All") {
                aFilters.push(new Filter("Category", FilterOperator.EQ, sCategory));
            }
            oBinding.filter(aFilters.length === 1 ? aFilters : (aFilters.length > 1 ? [new Filter({ filters: aFilters, and: true })] : []));
        },

        onAddProduct: function () {
            this.byId("newProdName").setValue("");
            this.byId("newProdPrice").setValue("");
            this.byId("newProdStock").setValue("");
            this.byId("addProductDialog").open();
        },

        onSaveProduct: function () {
            var sName = this.byId("newProdName").getValue();
            var sCategory = this.byId("newProdCategory").getSelectedKey();
            var sPrice = this.byId("newProdPrice").getValue();
            var sStock = this.byId("newProdStock").getValue();

            if (!sName || !sPrice) {
                MessageBox.error("Product Name and Price are required.");
                return;
            }

            var oModel = this.getModel();
            var aProducts = oModel.getProperty("/products") || [];
            var max = 0;
            aProducts.forEach(function (p) {
                var n = parseInt(p.ProductId.replace("P", ""), 10);
                if (n > max) max = n;
            });
            var sId = "P" + String(max + 1).padStart(3, "0");
            var nStock = parseInt(sStock) || 0;
            var sStatus = nStock === 0 ? "Out of Stock" : nStock < 5 ? "Low Stock" : "Available";

            aProducts.push({
                ProductId: sId, ProductName: sName, Category: sCategory,
                Price: parseFloat(sPrice), Stock: nStock, Status: sStatus
            });
            oModel.setProperty("/products", aProducts);
            this.byId("addProductDialog").close();
            MessageToast.show("Product '" + sName + "' added successfully!");
        },

        onCancelProduct: function () {
            this.byId("addProductDialog").close();
        },

        onEditProduct: function (oEvent) {
            var oProduct = oEvent.getSource().getParent().getParent().getBindingContext().getObject();
            var oModel = this.getModel();
            oModel.setProperty("/editProduct", jQuery.extend(true, {}, oProduct));

            var that = this;
            if (!this._oProductEditDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "o2c.view.fragment.ProductEditDialog",
                    controller: this
                }).then(function (oDialog) {
                    that._oProductEditDialog = oDialog;
                    that.getView().addDependent(that._oProductEditDialog);
                    that._oProductEditDialog.open();
                }).catch(function (err) {
                    MessageBox.error("Failed to load edit dialog: " + (err && err.message ? err.message : err));
                });
            } else {
                this._oProductEditDialog.open();
            }
        },

        onSaveProductEdit: function () {
            var oModel = this.getModel();
            var oEditProduct = oModel.getProperty("/editProduct");
            
            if (!oEditProduct.ProductName || !oEditProduct.Price) {
                MessageBox.error("Product Name and Price are required.");
                return;
            }
            
            var aProducts = oModel.getProperty("/products") || [];
            var idx = aProducts.findIndex(function (p) { return p.ProductId === oEditProduct.ProductId; });
            
            if (idx >= 0) {
                var nStock = parseInt(oEditProduct.Stock) || 0;
                var sStatus = nStock === 0 ? "Out of Stock" : nStock < 5 ? "Low Stock" : "Available";
                
                oEditProduct.Stock = nStock;
                oEditProduct.Status = sStatus;
                oEditProduct.Price = parseFloat(oEditProduct.Price);
                
                aProducts[idx] = oEditProduct;
                oModel.setProperty("/products", aProducts.slice());
                this._oProductEditDialog.close();
                MessageToast.show("Product '" + oEditProduct.ProductName + "' updated successfully!");
            }
        },

        onCancelProductEdit: function () {
            this._oProductEditDialog.close();
        },

        formatCurrency: function (val) {
            if (!val && val !== 0) return "₹0";
            return "₹" + parseFloat(val).toLocaleString("en-IN");
        },

        formatStatusState: function (s) {
            return BaseController.prototype.formatStatusState.call(this, s);
        },

        formatStockState: function (nStock) {
            if (nStock === 0) return "Error";
            if (nStock < 5) return "Warning";
            return "Success";
        }
    });
});