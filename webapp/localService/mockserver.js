sap.ui.define([
    "sap/ui/core/util/MockServer"
], function (MockServer) {
    "use strict";

    var oMockServer;

    return {
        rootUri: "/sap/opu/odata/sap/Z_O2C_SRV/",

        init: function () {
            if (oMockServer) {
                return oMockServer;
            }

            MockServer.config({
                autoRespond: true,
                autoRespondAfter: 300
            });

            oMockServer = new MockServer({
                rootUri: this.rootUri
            });

            oMockServer.simulate(sap.ui.require.toUrl("o2c/localService/metadata.xml"), {
                sMockdataBaseUrl: sap.ui.require.toUrl("o2c/localService/mockdata"),
                bGenerateMissingMockData: true
            });

            oMockServer.start();
            return oMockServer;
        }
    };
});
