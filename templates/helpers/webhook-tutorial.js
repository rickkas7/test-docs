var Handlebars = require('handlebars');
module.exports = function(key) {
	var html = '<span class="webhookTutorialSpan" data-key="' + key + '"></span>';
	return new Handlebars.SafeString(html);
}
