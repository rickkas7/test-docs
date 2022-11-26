
$(document).ready(function() {
    $('.webhookTutorialStarted').hide();

    if ($('.apiHelper').length == 0) {
        return;
    }

    const serverUrlBase = 'https://docs4.rickk.com:8002/';
    const webhookName = 'WebhookTutorial01';

    let sessionId;
    let webhookId;
    let currentKind;

    let spanData = {
        webhookName,
        lastDeviceId: '<last-device-id>',
    };

    const updateSpans = function() {
        $('.webhookTutorialSpan').each(function() {
            const thisPartial = $(this);
    
            const key = $(thisPartial).data('key');
            console.log('updateSpans key=' + key, spanData);

            if (spanData[key]) {
                $(thisPartial).text(spanData[key]);
            }            
        });
    };

    // Add a table row with two columns to a table
    // options.left - text contents for left cell
    //  .right - text contents for right cell
    //  .rightPre - text content for right cell, but format as a <pre>
    //  .tbodyElem - table body to append to
    const addTwoColumnRow = function(options) {        
        const trElem = document.createElement('tbody');

        let tdElem = document.createElement('td');
        $(tdElem).text(options.left);
        $(tdElem).css('width', '75px');
        $(trElem).append(tdElem);

        tdElem = document.createElement('td');
        $(tdElem).css('width', '275px');

        if (options.rightPre) {
            const preElem = document.createElement('pre');
            $(preElem).css('width', '275px');
            $(preElem).css('overflow', 'auto');
            $(preElem).css('white-space', 'pre')
            $(preElem).css('padding', '0px 0px 0px 0px')
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

    // Add multiple rows to a table
    // options.tbodyElem - table body to append to
    //  .keys - array of keys to use for each row
    //  .data - object containing the data to use for each row
    //  .mapKeys - optional object. If mapKeys[key] exists, it's used as the left title for the cell
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


    // Add a block to the log
    // options.outputElem - element to append to
    //  .content - Content to insert into the box
    //  .bannerText - Text for the top banner
    //  .bannerBackground - Color for the banner background
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

        $(options.outputElem).append(blockDivElem);

        $('.webhookTutorialExample').each(function() {
            const exampleElem = $(this);
            const exampleOptions = $(exampleElem).data('options').split(',').map(e => e.trim());

            if (!options.currentKind) {
                return;
            }

            if (!exampleOptions.includes(options.currentKind)) {
                return;
            }

            if (!exampleOptions.includes(options.op)) {
                return;
            }

            if (options.op == 'event' && exampleOptions.includes('trigger') && !options.event.name.startsWith(webhookName)) {
                return;
            }

            if (options.op == 'event') {
                const hookKind = exampleOptions.find(e => e.startsWith('hook-'));
                if (hookKind) {
                    console.log('has hookKind=' + hookKind + ' eventKind=' + options.eventKind);
                    if (options.eventKind != hookKind) {
                        return;
                    }
                }
            }

            // Update this element
            $(exampleElem).html(blockDivElem.cloneNode(true));        
        });
    }

    // Adds a new block that contains a table
    // options.outputElem - element to append to
    //  .bannerText - Text for the top banner
    //  .bannerBackground - Color for the banner background
    // 
    // Calls fn(tbody, options) to fill in the table rows under the time row
    const logAddBlockTable = function(options, fn) {
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



    const logAddItem = function(options) {
        let options2 = Object.assign({}, options);
        options2.currentKind = currentKind;
        
        const logDivElem = options2.outputElem = $('.webhookTutorialLog');

        const width = $(logDivElem).width();
        const scrollLeft = $(logDivElem).scrollLeft();
        const scrollWidthBefore = $(logDivElem)[0].scrollWidth;

        switch(options2.op) {
            case 'event':

                if (options2.event.coreid == 'api') {
                    options2.bannerText = 'Event (API)';
                    options2.bannerBackground = '#5FD898';   // COLOR_Mint_700
                    options2.currentKind = currentKind = 'api'; 
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
                    const m = options2.event.name.match(/(hook-[a-z]+)/);
                    if (m) {
                        // hook-sent, hook-response, hook-error
                        options2.eventKind = m[1];
                    }
                }
                else {
                    options2.bannerText = 'Event (Device)';
                    options2.bannerBackground = '#00E1FF';   // COLOR_ParticleBlue_500
                    options2.currentKind = currentKind = 'device';
                    spanData.lastDeviceId = options2.event.coreid;
                    updateSpans();
                }
        
                logAddBlockTable(options2, function(tbodyElem) {
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
                break;

            case 'hook':
                options2.bannerText = 'Webhook Received';
                options2.bannerBackground = '#FA6200';   // COLOR_Tangerine_600
        
                logAddBlockTable(options2, function(tbodyElem) {
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
        
                    logAddItem({op:'data', data:dataJson});
                }
                catch(e) {         
                    console.log('error parsing body', e);   
                }
                break;

            case 'hookResponse':
                options2.bannerText = 'Webhook Response';
                options2.bannerBackground = '#FF9F61';    // COLOR_Tangerine_400
        
                logAddBlockTable(options2, function(tbodyElem) {
        
                    let addRowOptions = {
                        keys: ['statusCode', 'body'],
                        data: options2.hook,
                        tbodyElem,
                    };
                    addMultipleRows(addRowOptions);
                });
                 break;

            case 'data':
                options2.bannerText = 'Parsed Data';
                options2.bannerBackground = '#FFADBD';   // COLOR_Watermelon_400
        
                logAddBlockTable(options2, function(tbodyElem) {
                    let addRowOptions = {
                        keys: Object.keys(options2.data),
                        data: options2.data,
                        tbodyElem,
                    };
                    addMultipleRows(addRowOptions);
                });
                break;
        }

        const scrollWidthAfter = $(logDivElem)[0].scrollWidth;

        // console.log('scroll', { width, scrollLeft, scrollWidthBefore, scrollWidthAfter})

        if (!options2.noScroll && scrollWidthBefore >= width) {
            if (scrollLeft >= (scrollWidthBefore - width - 200)) {
                // Scrolled to right, auto-scroll
                $(logDivElem).scrollLeft(scrollWidthAfter - width);
            }    
            $('.webhookTutorialLogScrollControls').show();
        }

    };

    
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
    
        spanData = Object.assign(spanData, settings);
        updateSpans();

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
                            logAddItem({op:'event', event});    
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
                logAddItem({op:'hook', hook: hookObj});    
            }
            catch(e) {
                console.log('exception in hook listener', e);
            }
        });


        evtSource.addEventListener('hookResponse', function(event) {
            try {
                const hookObj = JSON.parse(event.data);

                console.log('hookResponse', hookObj);
                logAddItem({op:'hookResponse', hook: hookObj});    
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
            id: Math.floor(Math.random() * 100000),
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

        updateSpans();
    });
});

