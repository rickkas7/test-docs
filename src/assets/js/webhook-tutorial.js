$(document).ready(function() {
    $('.webhookTutorialStarted').hide();

    if ($('.apiHelper').length == 0) {
        return;
    }

    const serverUrlBase = 'http://home.rickk.com:5123/';
    const webhookSuffix = 'WebhookTutorial';

    let uuid;
    let webhookId;
    let webhookName;
       

    const logAddBlock = function(options) {
        const blockDivElem = document.createElement('div');

        const bannerDivElem = document.createElement('div');
        $(bannerDivElem).css('padding', '10px 0px 10px 0px');
        $(bannerDivElem).text(options.bannerText);

        $(blockDivElem).append(bannerDivElem);

        $(blockDivElem).append(options.content);

        $('.webhookTutorialLog').prepend(blockDivElem);
    }

    const addTwoColumnRow = function(options) {        
        const trElem = document.createElement('tbody');

        let tdElem = document.createElement('td');
        $(tdElem).text(options.left);
        $(trElem).append(tdElem);

        tdElem = document.createElement('td');
        $(tdElem).text(options.right);
        $(trElem).append(tdElem);

        $(options.tbodyElem).append(trElem);
    }
    const addMultipleRows = function(options) {
        for(const key of options.keys) {
            if (options.skipKeys) {
                if (options.skipKeys.includes(key)) {
                    continue;
                }   
            }
            addTwoColumnRow({
                left: (options.mapKey && options.mapKey[key]) ? options.mapKey[key] : key,
                right: options.data[key],
                tbodyElem: options.tbodyElem,
            })
        }
    }

    const logAddEvent = function(options) {
        // options.event.name, .data, .published_at, .coreid
        let options2 = Object.assign({}, options);

        options2.bannerText = 'Event';
        
        const outerDivElem = options2.content = document.createElement('div');

        const tableElem = document.createElement('table');
        $(tableElem).addClass('apiHelperTableNoMargin');

        const tbodyElem = document.createElement('tbody');

        let eventDataJson;
        try {
            eventDataJson = JSON.parse(options.event.data);
        }
        catch(e) {            
        }

        let addRowOptions = {
            keys: ['name', 'data', 'published_at', 'coreid'],
            skipKeys: [],
            data: options.event,
            tbodyElem,
        };
        if (eventDataJson) {
            addRowOptions.skipKeys.push('data');        
        }
        addMultipleRows(addRowOptions);

        $(tableElem).append(tbodyElem);

        $(outerDivElem).append(tableElem);

        if (eventDataJson) {
            const preElem = document.createElement('pre');
            $(preElem).attr('rows', 8);
            $(preElem).attr('cols', 80);
            $(preElem).addClass('apiHelperMonoSmall');
            $(preElem).text(JSON.stringify(eventDataJson, null, 4));

            $(outerDivElem).append(preElem);
        }


        logAddBlock(options2);
    }

    const logAddHook = function(options) {
        // options.hook .hookId, body, headers, method, originalUrl
        let options2 = Object.assign({}, options);

        options2.bannerText = 'Webhook Received';

        const outerDivElem = options2.content = document.createElement('div');

        logAddBlock(options2);
    }

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

    const checkWebhooks = async function() {
        const webhooks = await apiHelper.particle.listWebhooks({ auth: apiHelper.auth.access_token });

        console.log('webhooks', webhooks.body);

        for(const webhookObj of webhooks.body) {
            if (webhookObj.event.endsWith(webhookSuffix)) {
                console.log('old hook exists', webhookObj); 
                await apiHelper.particle.deleteWebhook({ hookId: webhookObj.id, auth: apiHelper.auth.access_token });     
            }
        }

        // Create new webhook
        webhookName = uuid + webhookSuffix;
        
        let settings = {
            headers: {
                'Content-Type': 'application/json'
            },
            integration_type: 'Webhook',
            json: { 
                "event": "{{{PARTICLE_EVENT_NAME}}}",
                "data": "{{{PARTICLE_EVENT_VALUE}}}",
                "coreid": "{{{PARTICLE_DEVICE_ID}}}",
                "published_at": "{{{PARTICLE_PUBLISHED_AT}}}"
            },
            noDefaults: true,
            requestType: 'POST',
            // responseTopic
            // errorResponseTopic
            // responseTemplate
            rejectUnauthorized: false,
            url: serverUrlBase + 'hook/' + uuid
        };
        $('.webhookTutorialHookEvent').text(webhookName);
        $('.webhookTutorialHookUrl').text(settings.url);
        $('.webhookTutorialHookRequestType').text(settings.requestType);
        $('.webhookTutorialHookJSON').val(JSON.stringify(settings.json, null, 4));
    

        const createResult = await apiHelper.particle.createIntegration({ event: webhookName, settings, auth: apiHelper.auth.access_token });             
        console.log('createResult', createResult);

        webhookId = createResult.body.id;
    }

    const startSession = function() {
        // Create a new SSE session which creates a new tutorial session
        const evtSource = new EventSource(serverUrlBase + 'stream', {withCredentials:false});

        evtSource.addEventListener('start', function(event) {
            const dataObj = JSON.parse(event.data);

            uuid = dataObj.uuid;

            sendControl({test:1234});
            checkWebhooks();

            apiHelper.particle.getEventStream({ deviceId: 'mine', auth: apiHelper.auth.access_token }).then(function(stream) {                
                stream.on('event', function(event) {
                    try {
                        console.log('event', event);
                        // event.name, .data, .published_at, .coreid
                        logAddEvent({event});    
                    }
                    catch(e) {
                        console.log('exception in event listener', e);
                    }
                });
            });
        });

        evtSource.addEventListener('hook', function(event) {
            try {
                const hookObj = JSON.parse(event.data);

                console.log('hook', hookObj);
                logAddHook({hook: hookObj});    
            }
            catch(e) {
                console.log('exception in hook listener', e);
            }
        });


        evtSource.onerror = function(err) {
            console.error("EventSource failed:", err);
        };
    }

    $('.webhookTutorialHookTest').on('click', async function() {
        const dataObj = {
            op: 'test',
        };
        await apiHelper.particle.publishEvent({ name: webhookName, data: JSON.stringify(dataObj), auth: apiHelper.auth.access_token });

    });

    $('.webhookTutorialHookOpenInConsole').on('click', async function() {
        window.open('https://console.particle.io/integrations/webhooks/' + webhookId, '_blank');
    });

    $('.webhookTutorial').each(function() {
        const thisPartial = $(this);

        const options = $(thisPartial).data('options').split(',').map(e => e.trim());

        if (!apiHelper.auth) {
            return;
        }

        if (options.includes('start')) {
            $(thisPartial).find('.webhookTutorialStart').on('click', function() {
                startSession();
                $(thisPartial).hide();

                $('.webhookTutorialStarted').show();

            });
        }

    });
});

