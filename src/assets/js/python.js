let python = {};

$(document).ready(function() {
    if ($('.apiHelper').length == 0) {
        return;
    }

    python.updateConnectUI = function(forceDisable = false) {
        $('.pythonConnectConnect').prop('disabled', forceDisable || python.usbConnected);
        $('.pythonConnectDisconnect').prop('disabled', forceDisable || !python.usbConnected);

    };

    python.updateConnectStatus = function(s) {
        $('.pythonConnectStatus').text(s);
    }

    python.appendDebugLog = function(s) {
        const elem = $('.pythonDebugLogsTextArea');
        let old = $(elem).val(); 
        $(elem).val(old + s);

        if ($('.pythonDebugLogsScrollToEnd').prop('checked')) {
            elem[0].scrollTop = elem[0].scrollHeight;
        }
    }
    python.appendOutput = function(s) {
        const elem = $('.pythonOutputTextArea');
        let old = $(elem).val(); 
        $(elem).val(old + s);

        if ($('.pythonOutputScrollToEnd').prop('checked')) {
            elem[0].scrollTop = elem[0].scrollHeight;            
        }
    }

    python.selectDevice = function(deviceId) {
        python.deviceId = deviceId;

        $('.pythonDeviceSelect').val(python.deviceId);
        $('.apiHelperEventViewerDeviceSelect').val(python.deviceId);
    }


    if (!navigator.usb) {
        python.updateConnectStatus('Your web browser does not support WebUSB and cannot be used.');
        python.updateConnectUI(true);
        return;
    }

    python.delayMs = async function(ms) {
        await new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve();
            }, ms);
        }); 
    }

    // Task queue objects:
    // reqObj: control request object or 
    // reqString string request
    // json: true if result is JSON
    // cb: async callback function to call parameter is the control request data
    python.deviceTaskQueue = [];

    python.queueOutputRequest = function() {
        python.deviceTaskQueue.push({
            reqObj: {
                op: 'output',
            },
            json: false,
            cb: async function(s) {
                python.appendOutput(s);
            },
        });
    }
    python.queueLogsRequest = function() {
        python.deviceTaskQueue.push({
            reqObj: {
                op: 'logs',
            },
            json: false,
            cb: async function(s) {
                python.appendDebugLog(s);
            },
        });
    }


    python.queueStatusRequest = function() {
        python.deviceTaskQueue.push({
            reqObj: {
                op: 'status',
            },
            json: true,
            cb: async function(statusObj) {
                if (statusObj.output) {
                    python.queueOutputRequest();
                }
                if (statusObj.logs) {
                    python.queueLogsRequest();
                }
    
            },
        })

    };

    python.runDeviceTaskQueue = async function() {

        while(true) {
            // Wait until USB connected
            if (!python.usbConnected) {
                await python.delayMs(500);
                continue;
            }
            const deviceId = python.usbDevice.id;

            if (!python.lastStatusMs || Date.now() - python.lastStatusMs >= 500) {
                python.lastStatusMs = Date.now();
                python.queueStatusRequest();
            }


            // Process queue
            const task = python.deviceTaskQueue.shift();
            if (!task) {
                // console.log('no tasks');
                await python.delayMs(500);
                continue;
            }

            let isError = true;
            // console.log('running task', task);

            try {
                const res =  await python.usbDevice.sendControlRequest(10, task.reqObj ? JSON.stringify(task.reqObj) : task.reqString);    
                if (res.result == 0) {
                    if (task.json) {
                        if (res.data && res.data.length >= 2) {
                            const dataObj = JSON.parse(res.data);
                            // console.log('json task completed', dataObj);
                            await task.cb(dataObj);
                            isError = false;
                        }
                        else {
                            console.log('control request data too small for json', res.data);
                        }
                    }
                    else {
                        await task.cb(res.data);
                        isError = false;
                    }
                }
                else {
                    console.log('control request result error', res.result);
                }
            }
            catch(e) {
                console.log('exception getting control request', e);
            }
    
            if (isError) {
                // Update UI and state variables that we're no longer USB connected
                python.disconnected();

                // Empty queue
                python.deviceTaskQueue = [];

                if ($('.pythonAutoReconnect').prop('checked')) {
                    for(let tries = 1; !python.nativeUsbDevice && !python.isConnecting; tries++) {

                        python.updateConnectStatus('Waiting before reconnecting (attempt ' + tries + ')...');
                        await python.delayMs(3000);
                        if (python.isConnecting) {
                            // User manually initiated reconnecting
                            break;
                        }

                        try {                    
                            const nativeUsbDevices = await navigator.usb.getDevices();
        
                            if (nativeUsbDevices.length > 0) {
                                for(let dev of nativeUsbDevices) {
                                    if (dev.serialNumber == deviceId) {
                                        python.nativeUsbDevice = dev;
                                        break;
                                    }
                                }
                            }            
                        }         
                        catch(e) {
                            console.log('exception getting USB devices', e);
                        }    
                    }
                    if (python.nativeUsbDevice) {
                        python.connected();
                    }
                }
                else {
                    // No auto-reconnect so go back up and wait until connected
                }
            }   
            else {
                // Not an error, run loop again immediately (no extra delay)
            } 
        }

    };
    python.runDeviceTaskQueue(); // Run asynchronously

    python.connected = async function() {
        python.updateConnectStatus('Attempting to connect by USB...');

        python.usbDevice = await ParticleUsb.openNativeUsbDevice(python.nativeUsbDevice, {});

        python.updateConnectStatus('Connected!');
        setTimeout(function() {
            python.updateConnectStatus('');
        }, 2000);

        python.usbConnected = true;
        python.updateConnectUI(false);

        python.selectDevice(python.usbDevice.id);

        $('.pythonDebugLogsTextArea,.pythonOutputTextArea').val('');


        const msg = 'Connected by USB!\n';
        python.appendDebugLog(msg)
        python.appendOutput(msg);

        $('.pythonConnectedUSB').prop('disabled', false);
        python.updateSendUSB();
        
    }

    python.disconnected = async function() {
        if (python.usbDevice) {
            try {
                python.usbDevice.close();
            }
            catch(e) {
                console.log('failed to disconnect', e);
            }    
        }
        python.nativeUsbDevice = null;

        const msg = 'Disconnected from USB. This section will update only when connected.\n';
        python.appendDebugLog(msg)
        python.appendOutput(msg)    

        $('.pythonConnectedUSB').prop('disabled', true);
        python.updateSendUSB();

        python.usbDevice = null;
        python.nativeUsbDevice = null;
        python.usbConnected = false;

        python.updateConnectUI();


    }

    $('.pythonConnectConnect').on('click', async function() {
        python.updateConnectUI(true);
        python.isConnecting = true;

        // TODO: Also filter on device?
        const filters = [
            {vendorId: 0x2b04}
        ];
        try {
            python.nativeUsbDevice = await navigator.usb.requestDevice({ filters: filters });

            await python.connected();
        }
        catch(e) {
            console.log('failed to connect', e);
            python.updateConnectUI();
        }

        python.isConnecting = false;


    });
    $('.pythonConnectDisconnect').on('click', async function() {
        python.updateConnectUI(true);

        await python.disconnected();
    });
  
    apiHelper.deviceList('.pythonDeviceSelect', {
        getTitle: function (dev) {
            return dev.name + ' (' + dev.id + ')' + (dev.online ? '' : ' (offline)');
        },
        hasRefresh: true,
        onChange: function (elem) {
            python.selectDevice($(elem).val());
        }
    });   

    python.updateSendUSB = function() {
        const defaultTitle = 'Send script by USB and run';
        const shortcutMsg = ' (Shift-Return)';
        let restoreDefault = true;

        if (python.usbConnected) {
            const script = python.scriptCodeMirror.getValue();
            if (script.length) {
                restoreDefault = false;

                if ($(document.activeElement).hasClass('pythonScriptTextArea')) {
                    $('.pythonScriptSendUSB').text(defaultTitle + shortcutMsg);
                }
                else {
                    $('.pythonScriptSendUSB').text(defaultTitle);
                }
                $('.pythonScriptSendUSB').prop('disabled', false);                        
            }
        }
        
        if (restoreDefault) {
            $('.pythonScriptSendUSB').text(defaultTitle);
            $('.pythonScriptSendUSB').prop('disabled', true);        
        }
    };

    $('.pythonScriptTextArea').on('input change focus blur', python.updateSendUSB);

    $('.pythonScriptSendUSB').on('click', async function() {
        $('.pythonScriptSendUSB').prop('disabled', true);

        python.deviceTaskQueue.push({
            reqObj: {
                op: 'run',
                script: python.scriptCodeMirror.getValue(),
            },
            json: true,
            cb: async function(resultObj) {
            },
        })

        setTimeout(function() {
            $('.pythonScriptSendUSB').prop('disabled', false);
            $('.pythonScriptTextArea').focus();    
        }, 500);
    });


    $('.pythonScriptTextArea').on('keydown', function(ev) {
        if (ev.key != 'Enter' || !ev.shiftKey) {
            return;
        }
        
        if (!$('.pythonScriptSendUSB').prop('disabled')) {
            $('.pythonScriptSendUSB').trigger('click');
            ev.preventDefault();    
        }
    });

    $('.pythonScriptTextArea').each(function() {
            
        python.scriptCodeMirror = CodeMirror.fromTextArea($(this)[0], {
            gutters: [], // "CodeMirror-lint-markers"
            lineNumbers: true,
            /*
            lint: {
                "getAnnotations": function(cm, updateLinting, options) {
                    const errors = CodeMirror.lint.json(cm);
                    
                    if (errors.length == 0) {
                        $(parentElem).find('.apiHelperJsonLinterValidOnlyButton').removeAttr('disabled');
                    }
                    else {
                        $(parentElem).find('.apiHelperJsonLinterValidOnlyButton').attr('disabled', 'disabled');
                    }

                    const event = new CustomEvent('linted', { errors: errors });
                    $(parentElem)[0].dispatchEvent(event);

                    updateLinting(errors);
                },
                "async": true
            },
            */
            mode: "text/x-python", 
        });
    });

    $('.pythonSamples').on('change', async function() {
        const filename = $('.pythonSamples').val();
        if (filename == '-') {
            return;
        }

        const scriptText = await new Promise(function(resolve, reject) {
            const fetchRes = fetch('/assets/files/python-samples/' + filename)
            .then(response => response.text())
            .then(function(result) {
                resolve(result);
            });
        });

        console.log('sample', scriptText);

        python.scriptCodeMirror.setValue(scriptText);
        $('.pythonScriptTextArea').focus();
    });
    
    {
        // Load example code
        // TODO: Only do this if the previous code was not saved in local storage
        $('.pythonSamples').val('hello-world.py');
        $('.pythonSamples').trigger('change');
    }

    {
        const msg = 'This section will be updated when connected by USB\n';
        python.appendDebugLog(msg);
        python.appendOutput(msg);       
    }

});
