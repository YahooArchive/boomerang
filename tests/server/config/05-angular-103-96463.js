BOOMR_configt=new Date().getTime();
BOOMR.init({
	Angular: {
		enabled: true
	},
	autorun: false,
	ResourceTiming: {
		enabled: true
	},
	PageParams: {
		pageGroups: [
			{
				type: "Regexp",
				parameter1: "/pages/",
				parameter2: "MATCH"
			}
		]
	}
});
