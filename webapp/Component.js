sap.ui.define([
    "sap/ui/core/UIComponent",
    "o2c/model/models",
    "o2c/localService/mockserver"
], function (UIComponent, models, mockserver) {
    "use strict";

    return UIComponent.extend("o2c.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            mockserver.init();

            // Set device model
            this.setModel(models.createDeviceModel(), "device");

            // Initialize main data model
            this.setModel(models.createMainModel());

            // Initialize router
            this.getRouter().initialize();
        }
    });
});
