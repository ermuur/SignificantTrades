module.exports = {
	getIp(req) {
		let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

		if (ip.indexOf('::ffff:') === 0) {
			ip = ip.substr('::ffff:'.length, ip.length);
		}

		return ip;
	},

	getHms(timestamp, round) {
		var h = Math.floor(timestamp / 1000 / 3600);
		var m = Math.floor(timestamp / 1000 % 3600 / 60);
		var s = Math.floor(timestamp / 1000 % 3600 % 60);
		var output = '';

		output += ((!round || !output.length) && h > 0 ? h + 'h' + (!round && m ? ', ' : '') : "");
		output += ((!round || !output.length) && m > 0 ? m + 'm' + (!round && s ? ', ' : '') : "");
		output += ((!round || !output.length) && s > 0 ? s + 's' : "");

		if (!output.length || (!round && timestamp < 60 * 1000 && timestamp > s * 1000))
			output += (output.length ? ', ' : '') + (timestamp - s * 1000) + 'ms';

		return output.trim();
	}
}