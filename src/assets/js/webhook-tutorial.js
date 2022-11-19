$(document).ready(function() {
    if ($('.apiHelper').length == 0) {
        return;
    }

    const serverUrlBase = 'http://localhost:5123/';

    let uuid;

    const sendControl = function(reqObj) {
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(reqObj),
            dataType: 'json',
            error: function (jqXHR, textStatus, errorThrown) {
                // 
                console.log('control error', errorThrown);
            },
            method: 'POST',
            success: function (data) {
                console.log('control success', data);
            },
            url: serverUrlBase + 'control/' + uuid,
        });        
    }

    $('.webhookTutorial').each(function() {
        const thisPartial = $(this);

        const options = $(thisPartial).data('options').split(',').map(e => e.trim());

        if (!apiHelper.auth) {
            return;
        }

        console.log('options', options);

        if (options.includes('session')) {
            // Create a new SSE session which creates a new tutorial session
            const evtSource = new EventSource(serverUrlBase + 'stream', {withCredentials:false});

            evtSource.addEventListener('start', function(event) {
                const dataObj = JSON.parse(event.data);

                uuid = dataObj.uuid;

                sendControl({test:1234});
            });

            evtSource.onerror = function(err) {
                console.error("EventSource failed:", err);
            };
        }        

    });
});

