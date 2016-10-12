if (typeof exports == "undefined") {exports = window.Core}
exports.change_sql_list = {
	"1.102" : [
		"alter table feeds add column last_guid_list TEXT",
		"UPDATE feeds SET last_guid_list='[]'",
	]
};
