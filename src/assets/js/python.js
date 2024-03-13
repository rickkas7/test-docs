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

    python.sendControlRequestJSON = async function(reqObj) {
        let dataObj = null;

        try {
            const res =  await python.usbDevice.sendControlRequest(10, JSON.stringify(reqObj));    
            if (res.result == 0 && res.data && res.data.length > 0) {
                dataObj = JSON.parse(res.data);
            }    
        }
        catch(e) {
            console.log('exception getting control request', e);
        }
        return dataObj;
    }

    python.sendControlRequestString = async function(reqObj) {
        let resultStr = "";

        try {
            const res =  await python.usbDevice.sendControlRequest(10, JSON.stringify(reqObj));    
            if (res.result == 0 && res.data) {
                resultStr = res.data;
            }    
        }
        catch(e) {
            console.log('exception getting control request', e);
        }
        return resultStr;
    }

    if (!navigator.usb) {
        python.updateConnectStatus('Your web browser does not support WebUSB and cannot be used.');
        python.updateConnectUI(true);
        return;
    }

    python.checkStatus = async function() {
        try {
            const statusObj = await python.sendControlRequestJSON({op:'status'});
            // console.log('statusObj', statusObj);    

            if (statusObj.output) {
                let s = await python.sendControlRequestString({op:'output'});
                python.appendOutput(s);
            }
            if (statusObj.logs) {
                let s = await python.sendControlRequestString({op:'logs'});
                python.appendDebugLog(s);
            }
        }
        catch(e) {
            console.log('exception in status request', e);
        }
    }

    $('.pythonConnectConnect').on('click', async function() {
        python.updateConnectUI(true);

        // TODO: Also filter on device?
        const filters = [
            {vendorId: 0x2b04}
        ];
        try {
            python.nativeUsbDevice = await navigator.usb.requestDevice({ filters: filters });

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
            
            if (!python.statusTimer) {
                python.statusTimer = setInterval(async function() {
                    if (!python.statusActive) {
                        python.statusActive = true;
                        await python.checkStatus();
                        python.statusActive = false;
                    }
                }, 500);
            }
    
        }
        catch(e) {
            console.log('failed to connect', e);
            python.updateConnectUI();
            return;
        }



    });
    $('.pythonConnectDisconnect').on('click', async function() {
        python.updateConnectUI(true);

        if (python.statusTimer) {
            clearInterval(python.statusTimer);
            python.statusTimer = 0;
        }

        if (python.usbDevice) {
            try {
                python.usbDevice.close();
            }
            catch(e) {
                console.log('failed to disconnect', e);
            }
            
        }
        const msg = 'Disconnected from USB. This section will update only when connected.\n';
        python.appendDebugLog(msg)
        python.appendOutput(msg)    

        $('.pythonConnectedUSB').prop('disabled', true);
        python.updateSendUSB();

        python.usbDevice = null;
        python.nativeUsbDevice = null;
        python.usbConnected = false;

        python.updateConnectUI();

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

        await python.sendControlRequestJSON({
            op: 'run',
            script: python.scriptCodeMirror.getValue(),
        });

        $('.pythonScriptSendUSB').prop('disabled', false);
        $('.pythonScriptTextArea').focus();
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
