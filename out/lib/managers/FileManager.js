"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeCurrentPayload = exports.sendBatchPayload = exports.batchSendPayloadData = exports.getLastSavedKeystrokesStats = exports.batchSendData = exports.batchSendArrayData = exports.sendOfflineData = exports.sendOfflineTimeData = exports.clearLastSavedKeystrokeStats = void 0;
const HttpClient_1 = require("../http/HttpClient");
const Util_1 = require("../Util");
const TimeSummaryData_1 = require("../storage/TimeSummaryData");
const fs = require("fs");
// batch offline payloads in 8. sqs has a 256k body limit
const batch_limit = 8;
let latestPayload = null;
function clearLastSavedKeystrokeStats() {
    latestPayload = null;
}
exports.clearLastSavedKeystrokeStats = clearLastSavedKeystrokeStats;
/**
 * send the offline TimeData payloads
 */
function sendOfflineTimeData() {
    return __awaiter(this, void 0, void 0, function* () {
        batchSendArrayData("/data/time", TimeSummaryData_1.getTimeDataSummaryFile());
        // clear time data data. this will also clear the
        // code time and active code time numbers
        TimeSummaryData_1.clearTimeDataSummary();
    });
}
exports.sendOfflineTimeData = sendOfflineTimeData;
/**
 * send the offline data.
 */
function sendOfflineData(isNewDay = false) {
    return __awaiter(this, void 0, void 0, function* () {
        batchSendData("/data/batch", Util_1.getSoftwareDataStoreFile());
    });
}
exports.sendOfflineData = sendOfflineData;
/**
 * batch send array data
 * @param api
 * @param file
 */
function batchSendArrayData(api, file) {
    return __awaiter(this, void 0, void 0, function* () {
        let isonline = yield HttpClient_1.serverIsAvailable();
        if (!isonline) {
            return;
        }
        try {
            if (fs.existsSync(file)) {
                const payloads = Util_1.getFileDataArray(file);
                batchSendPayloadData(api, file, payloads);
            }
        }
        catch (e) { }
    });
}
exports.batchSendArrayData = batchSendArrayData;
function batchSendData(api, file) {
    return __awaiter(this, void 0, void 0, function* () {
        let isonline = yield HttpClient_1.serverIsAvailable();
        if (!isonline) {
            return;
        }
        try {
            if (fs.existsSync(file)) {
                const payloads = Util_1.getFileDataPayloadsAsJson(file);
                batchSendPayloadData(api, file, payloads);
            }
        }
        catch (e) { }
    });
}
exports.batchSendData = batchSendData;
function getLastSavedKeystrokesStats() {
    return __awaiter(this, void 0, void 0, function* () {
        const dataFile = Util_1.getSoftwareDataStoreFile();
        try {
            // try to get the last paylaod from the file first (data.json)
            if (fs.existsSync(dataFile)) {
                const currentPayloads = Util_1.getFileDataPayloadsAsJson(dataFile);
                if (currentPayloads && currentPayloads.length) {
                    // sort in descending order
                    currentPayloads.sort((a, b) => b.start - a.start);
                    // get the 1st element
                    latestPayload = currentPayloads[0];
                }
            }
        }
        catch (e) { }
        // returns one in memory if not found in file
        return latestPayload;
    });
}
exports.getLastSavedKeystrokesStats = getLastSavedKeystrokesStats;
function batchSendPayloadData(api, file, payloads) {
    return __awaiter(this, void 0, void 0, function* () {
        // send the batch
        if (payloads && payloads.length > 0) {
            // send batch_limit at a time
            let batch = [];
            for (let i = 0; i < payloads.length; i++) {
                if (batch.length >= batch_limit) {
                    let resp = yield sendBatchPayload(api, batch);
                    if (!HttpClient_1.isResponseOk(resp)) {
                        // there was a problem with the transmission.
                        // bail out so we don't delete the offline data
                        return;
                    }
                    batch = [];
                }
                batch.push(payloads[i]);
            }
            // send the remaining
            if (batch.length > 0) {
                let resp = yield sendBatchPayload(api, batch);
                if (!HttpClient_1.isResponseOk(resp)) {
                    // there was a problem with the transmission.
                    // bail out so we don't delete the offline data
                    return;
                }
            }
        }
        // we're online so just delete the file
        Util_1.deleteFile(file);
    });
}
exports.batchSendPayloadData = batchSendPayloadData;
function sendBatchPayload(api, batch) {
    // console.log("SEND BATCH LOOK HERE");
    // console.log(batch);
    return HttpClient_1.softwarePost(api, batch, Util_1.getItem("jwt")).catch((e) => { });
}
exports.sendBatchPayload = sendBatchPayload;
function storeCurrentPayload(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const content = JSON.stringify(payload, null, 4);
            fs.writeFileSync(this.getCurrentPayloadFile(), content, (err) => { });
        }
        catch (e) {
            //
        }
    });
}
exports.storeCurrentPayload = storeCurrentPayload;
//# sourceMappingURL=FileManager.js.map