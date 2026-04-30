/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["o2c/ordercash/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
