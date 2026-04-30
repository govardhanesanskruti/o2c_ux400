sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "o2c/model/models"
], function (UIComponent, JSONModel, models) {
    "use strict";

    return UIComponent.extend("o2c.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            // Set device model
            this.setModel(models.createDeviceModel(), "device");

            // Initialize main data model
            this.setModel(models.createMainModel());

            // Initialize router
            this.getRouter().initialize();
        }
    });
});