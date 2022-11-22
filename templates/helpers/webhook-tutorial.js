var Handlebars = require('handlebars');
module.exports = function(options) {
	var html = '<span class="webhookTutorialSpan" data-options="' + options + '"></span>';
	return new Handlebars.SafeString(html);
}
