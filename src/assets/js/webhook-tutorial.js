$(document).ready(function() {
    $('.webhookTutorialStarted').hide();

    if ($('.apiHelper').length == 0) {
        return;
    }

    const serverUrlBase = 'http://home.rickk.com:5123/';
    const webhookName = 'WebhookTutorial01';

    let sessionId;
    let webhookId;
       

    const logAddBlock = function(options) {
        const blockDivElem = document.createElement('div');
        // $(blockDivElem).css('width', '300px');

        const innerBoxElem = document.createElement('div');
        $(innerBoxElem).css('width', '350px');

        const bannerDivElem = document.createElement('div');
        $(bannerDivElem).text(options.bannerText);
        $(bannerDivElem).css('padding', '10px 10px 10px 10px');
        $(bannerDivElem).css('margin-right', '2px');
        $(bannerDivElem).css('font-size', '14px');
        $(bannerDivElem).css('color', '#000000'); // black
        
        
        if (options.bannerBackground) {
            $(bannerDivElem).css('background-color', options.bannerBackground);
        }

        $(innerBoxElem).append(bannerDivElem);

        $(innerBoxElem).append(options.content);            
    
        $(blockDivElem).append(innerBoxElem);

        const logDivElem = $('.webhookTutorialLog');

        const width = $(logDivElem).width();
        const scrollLeft = $(logDivElem).scrollLeft();
        const scrollWidthBefore = $(logDivElem)[0].scrollWidth;

        $('.webhookTutorialLog').append(blockDivElem);

        const scrollWidthAfter = $(logDivElem)[0].scrollWidth;

        // console.log('scroll', { width, scrollLeft, scrollWidthBefore, scrollWidthAfter})

        if (scrollWidthBefore >= width) {
            if (scrollLeft >= (scrollWidthBefore - width - 200)) {
                // Scrolled to right, auto-scroll
                $(logDivElem).scrollLeft(scrollWidthAfter - width);
            }    
            $('.webhookTutorialLogScrollControls').show();
        }


    }

    const addTwoColumnRow = function(options) {        
        const trElem = document.createElement('tbody');

        let tdElem = document.createElement('td');
        $(tdElem).text(options.left);
        $(trElem).append(tdElem);

        tdElem = document.createElement('td');

        if (options.rightPre) {
            const preElem = document.createElement('pre');
            $(preElem).addClass('apiHelperMonoSmall');
            $(preElem).text(options.right);
            $(tdElem).append(preElem);    
        }
        else {
            $(tdElem).text(options.right);
        }

        $(trElem).append(tdElem);

        $(options.tbodyElem).append(trElem);
    }
    const addMultipleRows = function(options) {
        for(const key of options.keys) {
            addTwoColumnRow({
                left: (options.mapKey && options.mapKey[key]) ? options.mapKey[key] : key,
                right: options.data[key],
                tbodyElem: options.tbodyElem,
                rightPre: true,
            })
        }
    }

    const addTable = function(options, fn) {
        const outerDivElem = document.createElement('div');

        const tableElem = options.content = document.createElement('table');
        $(tableElem).addClass('apiHelperTableNoMargin');

        const tbodyElem = document.createElement('tbody');

        addTwoColumnRow({
            left: 'Time',
            right: new Date().toTimeString().split(' ')[0],
            tbodyElem,
        });

        fn(tbodyElem, options);

        $(tableElem).append(tbodyElem);

        $(outerDivElem).append(tableElem);

        logAddBlock(options);
    };

    const logAddEvent = function(options) {
        // options.event.name, .data, .published_at, .coreid
        let options2 = Object.assign({}, options);

        if (options2.event.coreid == 'api') {
            options2.bannerText = 'Event (API)';
            options2.bannerBackground = '#5FD898';   // COLOR_Mint_700
        }
        else
        if (options2.event.coreid == 'particle-internal') {
            options2.bannerText = 'Event (Internal)';
            if (options2.event.name.indexOf('hook-error') >= 0) {
                options2.bannerBackground = '#FF6F76';  // COLOR_State_Red_500 
            }
            else {
                options2.bannerBackground = '#B0E5C9';  // COLOR_Mint_500 
            }
        }
        else {
            options2.bannerText = 'Event (Device)';
            options2.bannerBackground = '#00E1FF';   // COLOR_ParticleBlue_500
        }

        addTable(options2, function(tbodyElem) {
            let eventDataJson;
            try {
                eventDataJson = JSON.parse(options.event.data);
                options2.event.data = JSON.stringify(eventDataJson, null, 4);
            }
            catch(e) {            
            }
    
            let addRowOptions = {
                keys: ['name', 'data', 'published_at', 'coreid'],
                data: options2.event,
                tbodyElem,
            };
            addMultipleRows(addRowOptions);
        });

    }

    const logAddData = function(options) {
        let options2 = Object.assign({}, options);

        options2.bannerText = 'Parsed Data';
        options2.bannerBackground = '#FFADBD';   // COLOR_Watermelon_400

        addTable(options2, function(tbodyElem) {
            let addRowOptions = {
                keys: Object.keys(options2.data),
                data: options2.data,
                tbodyElem,
            };
            addMultipleRows(addRowOptions);
        });
        
    }

    const logAddHook = function(options) {
        // options.hook .hookId, body, headers, method, originalUrl, query
        let options2 = Object.assign({}, options);

        options2.bannerText = 'Webhook Received';
        options2.bannerBackground = '#FA6200';   // COLOR_Tangerine_600

        addTable(options2, function(tbodyElem) {
            let addRowOptions = {            
                keys: ['method', 'headers', 'body'], // 'query', 
                data: options2.hook,
                tbodyElem,
            };
            addMultipleRows(addRowOptions);
        });

        // Add to server received data
        try {
            const bodyJson = JSON.parse(options2.hook.body);

            const dataJson = JSON.parse(bodyJson.data);

            logAddData({data:dataJson});
        }
        catch(e) {         
            console.log('error parsing body', e);   
        }



    }

    const logAddHookResponse = function(options) {
        // options.hook .hookId, body, statusCode
        let options2 = Object.assign({}, options);

        options2.bannerText = 'Webhook Response';
        options2.bannerBackground = '#FF9F61';    // COLOR_Tangerine_400

        addTable(options2, function(tbodyElem) {

            let addRowOptions = {
                keys: ['statusCode', 'body'],
                data: options2.hook,
                tbodyElem,
            };
            addMultipleRows(addRowOptions);
        });
    }
    
    /*
    // Not currently used
    const sendControl = async function(reqObj) {
        await new Promise(function(resolve, reject) {
            $.ajax({
                contentType: 'application/json',
                data: JSON.stringify(reqObj),
                dataType: 'json',
                error: function (jqXHR, textStatus, errorThrown) {
                    // 
                    console.log('control error', errorThrown);
                    reject(errorThrown);
                },
                method: 'POST',
                success: function (data) {
                    console.log('control success', data);
                    resolve(data);
                },
                url: serverUrlBase + 'control/' + sessionId,
            });        
        });
    }
    */

    const checkWebhooks = async function() {
        const webhooks = await apiHelper.particle.listWebhooks({ auth: apiHelper.auth.access_token });

        console.log('webhooks', webhooks.body);

        webhookId = 0;

        for(const webhookObj of webhooks.body) {
            if (webhookObj.event == webhookName) {
                console.log('old hook exists', webhookObj); 
                webhookId = webhookObj.id;
            }
        }

        // Create new webhook
        
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
            responseTopic: '{{{PARTICLE_DEVICE_ID}}}/hook-response/{{{PARTICLE_EVENT_NAME}}}',
            errorResponseTopic: '{{{PARTICLE_DEVICE_ID}}}/hook-error/{{{PARTICLE_EVENT_NAME}}}',
            // responseTemplate
            rejectUnauthorized: false,
            url: serverUrlBase + 'hook/' + sessionId
        };
        $('.webhookTutorialHookEvent').text(webhookName);
        $('.webhookTutorialHookUrl').text(settings.url);
        $('.webhookTutorialHookRequestType').text(settings.requestType);
        $('.webhookTutorialHookJSON').val(JSON.stringify(settings.json, null, 4));
        $('.webhookTutorialHookResponseTopic').text(settings.responseTopic);
        $('.webhookTutorialHookErrorResponseTopic').text(settings.errorResponseTopic);
    
        

        if (webhookId) {
            const editResult = await apiHelper.particle.editIntegration({ integrationId:webhookId, event: webhookName, settings, auth: apiHelper.auth.access_token });   
            console.log('editResult', editResult);
        }
        else {
            const createResult = await apiHelper.particle.createIntegration({ event: webhookName, settings, auth: apiHelper.auth.access_token });             
            console.log('createResult', createResult);
    
            webhookId = createResult.body.id;    
        }

    }

    const startSession = function() {
        // Create a new SSE session which creates a new tutorial session
        const evtSource = new EventSource(serverUrlBase + 'stream', {withCredentials:false});

        evtSource.addEventListener('start', function(event) {
            const dataObj = JSON.parse(event.data);

            sessionId = dataObj.sessionId;

            checkWebhooks();

            apiHelper.particle.getEventStream({ deviceId: 'mine', auth: apiHelper.auth.access_token }).then(function(stream) {                
                stream.on('event', function(event) {
                    try {
                        console.log('event', event);

                        // event.name, .data, .published_at, .coreid
                        if (event.name.indexOf(webhookName) >= 0 || event.name.indexOf(sessionId) >= 0) {
                            logAddEvent({event});    
                        }
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


        evtSource.addEventListener('hookResponse', function(event) {
            try {
                const hookObj = JSON.parse(event.data);

                console.log('hookResponse', hookObj);
                logAddHookResponse({hook: hookObj});    
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

    $('.webhookTutorialLogScrollOldest').on('click', function() {
        const logDivElem = $('.webhookTutorialLog');
        $(logDivElem).scrollLeft(0);
    });

    $('.webhookTutorialLogScrollLatest').on('click', function() {
        const logDivElem = $('.webhookTutorialLog');
        const width = $(logDivElem).width();
        const scrollWidth = $(logDivElem)[0].scrollWidth;

        if (scrollWidth >= width) {
            $(logDivElem).scrollLeft(scrollWidth - width);
        }

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

