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

    if (!navigator.usb) {
        python.updateConnectStatus('Your web browser does not support WebUSB and cannot be used.');
        python.updateConnectUI(true);
        return;
    }


    $('.pythonConnectConnect').on('click', async function() {
        python.updateConnectUI(true);

        // TODO: Also filter on device?
        const filters = [
            {vendorId: 0x2b04}
        ];
        try {
            python.nativeUsbDevice = await navigator.usb.requestDevice({ filters: filters });

            python.usbDevice = await ParticleUsb.openNativeUsbDevice(python.nativeUsbDevice, {});

            python.usbConnected = true;
            python.updateConnectUI(false);
        }
        catch(e) {
            console.log('failed to connect', e);
            return;
        }



    });
    $('.pythonConnectDisconnect').on('click', async function() {
        python.updateConnectUI(true);

        if (python.usbDevice) {
            try {
                python.usbDevice.close();
    
            }
            catch(e) {
                console.log('failed to disconnect', e);
            }
            
        }

        python.usbDevice = null;
        python.nativeUsbDevice = null;
        python.usbConnected = false;

        python.updateConnectUI();

    });
  
});
