/* global countlyVue,CV,countlyCommon, $, countlySession,countlyTotalUsers,app, jQuery*/
var UserAnalyticsOverview = countlyVue.views.create({
    template: CV.T("/core/user-analytics-overview/templates/overview.html"),
    data: function() {
        return {
            description: CV.i18n('user-analytics.overview-desc'),
            tableData: [],
            graphOptions: this.createSeries(),
            lineLegend: this.createLineLegend(),
            lineOptions: this.createSeries(),
            isLoading: true
        };
    },
    mounted: function() {
        var self = this;
        $.when(countlySession.initialize(), countlyTotalUsers.initialize("users")).then(function() {
            self.calculateAllData();
        });
    },
    methods: {
        refresh: function() {
            var self = this;
            $.when(countlySession.initialize(), countlyTotalUsers.initialize("users")).then(function() {
                self.calculateAllData();
            });
        },
        calculateAllData: function() {
            var userDP = countlySession.getUserDP();
            this.lineOptions = this.createSeries(userDP.chartDP);
            this.tableData = this.calculateTableData();
            this.lineLegend = this.createLineLegend();
        },
        formatExportFunction: function() {
            var userDP = countlySession.getUserDP();
            var table = [];
            for (var k = 0; k < userDP.chartData.length; k++) {
                var item = {};
                item[CV.i18n('common.date')] = userDP.chartData[k].date;
                item[CV.i18n('common.table.total-users')] = userDP.chartData[k].u;
                item[CV.i18n('common.table.new-users')] = userDP.chartData[k].n;
                item[CV.i18n('common.table.returning-users')] = userDP.chartData[k].returning;
                table.push(item);
            }
            return table;

        },
        calculateTableData: function() {
            var userDP = countlySession.getUserDP();
            for (var k = 0; k < userDP.chartData.length; k++) {
                userDP.chartData[k].dateVal = k; //because we get them all always sorted by date
            }
            return userDP.chartData;
        },
        createSeries: function(data) {
            var series = [];

            if (data) {
                for (var k = 0; k < data.length; k++) {
                    series.push({"name": data[k].label, data: this.fixArray(data[k].data)});
                }
            }
            else {
                series.push({"name": CV.i18n('common.table.total-users'), data: []});
                series.push({"name": CV.i18n('common.table.new-users'), data: []});
                series.push({"name": CV.i18n('common.table.returning-users'), data: []});
            }

            return {series: series};
        },
        fixArray: function(array) {
            var aa = [];
            for (var k = 0; k < array.length; k++) {
                aa.push(array[k][1]);
            }
            return aa;
        },
        createLineLegend: function() {

            var sessionData = countlySession.getSessionData();
            sessionData = sessionData || {};
            sessionData.usage = sessionData.usage || {};
            sessionData.usage["total-users"] = sessionData.usage["total-users"] || {};
            sessionData.usage["new-users"] = sessionData.usage["new-users"] || {};
            sessionData.usage["returning-users"] = sessionData.usage["returning-users"] || {};

            var legend = {"type": "primary", data: []};

            legend.data = [
                {
                    "name": jQuery.i18n.map["common.table.total-users"],
                    "value": countlyCommon.formatNumber(sessionData.usage["total-users"].total),
                    "trend": (sessionData.usage["total-users"].trend === "d" ? "down" : "up"),
                    "tooltip": CV.i18n("common.table.total-users-desc"),
                    "percentage": sessionData.usage["total-users"].change
                },
                {
                    "name": jQuery.i18n.map["common.table.new-users"],
                    "value": countlyCommon.formatNumber(sessionData.usage["new-users"].total),
                    "trend": (sessionData.usage["new-users"].trend === "d" ? "down" : "up"),
                    "tooltip": CV.i18n("common.table.new-users-desc"),
                    "percentage": sessionData.usage["new-users"].change
                },
                {
                    "name": jQuery.i18n.map["common.table.returning-users"],
                    "value": countlyCommon.formatNumber(sessionData.usage["returning-users"].total),
                    "trend": (sessionData.usage["returning-users"].trend === "d" ? "down" : "up"),
                    "tooltip": CV.i18n("common.table.returning-users-desc"),
                    "percentage": sessionData.usage["returning-users"].change
                }
            ];

            return legend;
        }
    },
    computed: {

        topDropdown: function() {
            if (this.externalLinks && Array.isArray(this.externalLinks) && this.externalLinks.length > 0) {
                return this.externalLinks;
            }
            else {
                return null;
            }
        },
    },
    mixins: [
        countlyVue.container.dataMixin({
            'externalLinks': '/analytics/users/links'
        }),
        countlyVue.mixins.commonFormatters
    ]
});

var UserAnalyticsView = countlyVue.views.create({
    template: CV.T("/core/user-analytics-overview/templates/user-analytics.html"),
    mixins: [
        countlyVue.container.tabsMixin({
            "userAnalyticsTabs": "/analytics/users"
        })
    ].concat(countlyVue.container.mixins(["/analytics/users"])),
    data: function() {
        return {
            selectedTab: (this.$route.params && this.$route.params.tab) || "overview"
        };
    },
    computed: {
        tabs: function() {
            return this.userAnalyticsTabs;
        }
    }
});

var getUserAnalyticsView = function() {
    var tabsVuex = countlyVue.container.tabsVuex(["/analytics/users"]);
    return new countlyVue.views.BackboneWrapper({
        component: UserAnalyticsView,
        vuex: tabsVuex,
        templates: []
    });
};
app.route("/analytics/users", "user-analytics", function() {
    var ViewWrapper = getUserAnalyticsView();
    this.renderWhenReady(ViewWrapper);
});


app.route("/analytics/users/*tab", "user-analytics-tab", function(tab) {
    var ViewWrapper = getUserAnalyticsView();
    var params = {
        tab: tab
    };
    ViewWrapper.params = params;
    this.renderWhenReady(ViewWrapper);
});
//Analytics->User analytics - overview widget
var GridComponent = countlyVue.views.create({
    template: CV.T('/dashboards/templates/widgets/analytics/widget.html'), //using core dashboard widget template
    props: {
        data: {
            type: Object,
            default: function() {
                return {};
            }
        }
    },
    mounted: function() {
    },
    data: function() {
        return {
            showBuckets: false,
            map: {
                "u": this.i18n("common.table.total-users"),
                "r": this.i18n("common.table.returning-users"),
                "n": this.i18n("common.table.new-users")
            }
        };
    },
    methods: {
    },
    computed: {
        title: function() {
            if (this.data.title) {
                return this.data.title;
            }
            if (this.data.dashData) {
                return CV.i18n("user-analytics.overview-title");
            }
            return "";
        },
        metricLabels: function() {
            this.data = this.data || {};
            var listed = [];

            for (var k = 0; k < this.data.metrics.length; k++) {
                listed.push(this.map[this.data.metrics[k]] || this.data.metrics[k]);
            }
            return listed;
        },
        timelineGraph: function() {
            this.data = this.data || {};
            this.data.dashData = this.data.dashData || {};
            this.data.dashData.data = this.data.dashData.data || {};

            var legend = {"type": "primary", data: []};
            var series = [];
            var dates = [];
            var appIndex = 0;
            for (var app in this.data.dashData.data) {
                for (var k = 0; k < this.data.metrics.length; k++) {
                    series.push({ "data": [], "name": this.data.metrics[k] + app, "app": app, "metric": this.data.metrics[k]});
                    legend.data.push({"name": this.data.metrics[k] + app, "app": app, "metric": this.data.metrics[k]});
                }
                for (var date in this.data.dashData.data[app]) {
                    if (appIndex === 0) {
                        dates.push(date);
                    }
                    for (var kk = 0; kk < this.data.metrics.length; kk++) {
                        if (this.data.metrics[kk] === 'r') {
                            var vv = this.data.dashData.data[app][date].u - this.data.dashData.data[app][date].n;
                            series[appIndex * this.data.metrics.length + kk].data.push(vv);
                        }
                        else {
                            series[appIndex * this.data.metrics.length + kk].data.push(this.data.dashData.data[app][date][this.data.metrics[kk]] || 0);
                        }
                    }
                }
                appIndex++;
            }
            if (this.data.custom_period) {
                return {
                    lineOptions: {xAxis: { data: dates}, "series": series},
                    lineLegend: legend
                };
            }
            else {
                return {
                    lineOptions: {"series": series},
                    lineLegend: legend
                };
            }
        },
        stackedBarOptions: function() {
            return this.calculateStackedBarOptionsFromWidget(this.data);
        },
        number: function() {
            return this.calculateNumberFromWidget(this.data);
        }
    }
});

var DrawerComponent = countlyVue.views.create({
    template: "#usersoverview-drawer",
    data: function() {
        return {
        };
    },
    computed: {
        metrics: function() {
            return [
                { label: this.i18n("common.table.total-users"), value: "u" },
                { label: this.i18n("common.table.new-users"), value: "n" },
                { label: this.i18n("common.table.returning-users"), value: "r" }
            ];
        },
        enabledVisualizationTypes: function() {
            if (this.scope.editedObject.app_count === 'single') {
                return ['time-series', 'bar-chart', 'number'];
            }
            else if (this.scope.editedObject.app_count === 'multiple') {
                return ['time-series', 'bar-chart'];
            }
            else {
                return [];
            }
        },
        isMultipleMetric: function() {
            var multiple = false;
            var appCount = this.scope.editedObject.app_count;
            var visualization = this.scope.editedObject.visualization;

            if (appCount === 'single') {
                if (visualization === 'table' || visualization === 'time-series') {
                    multiple = true;
                }
            }

            return multiple;
        },
    },
    mounted: function() {
        if (this.scope.editedObject.breakdowns.length === 0) {
            this.scope.editedObject.breakdowns = ['overview'];
        }
    },
    methods: {
    },
    watch: {

    },
    props: {
        scope: {
            type: Object,
            default: function() {
                return {};
            }
        }
    }
});

countlyVue.container.registerData("/custom/dashboards/widget", {
    type: "analytics",
    label: CV.i18n("user-analytics.overview-title"),
    priority: 1,
    primary: false,
    getter: function(widget) {
        var kk = widget.breakdowns || [];
        if (widget.widget_type === "analytics" && widget.data_type === "user-analytics" && (kk.length === 0 || kk[0] === 'overview')) {
            return true;
        }
        else {
            return false;
        }
    },
    templates: [
        {
            namespace: "usersoverview",
            mapping: {
                "drawer": "/core/user-analytics-overview/templates/widgetDrawer.html"
            }
        }
    ],
    drawer: {
        component: DrawerComponent,
        getEmpty: function() {
            return {
                title: "",
                widget_type: "analytics",
                data_type: "user-analytics",
                app_count: 'single',
                metrics: [],
                apps: [],
                visualization: "",
                breakdowns: ['overview'],
                custom_period: "30days"
            };
        },
        beforeLoadFn: function(/*doc, isEdited*/) {
        },
        beforeSaveFn: function(/*doc*/) {
        }
    },
    grid: {
        component: GridComponent,
        dimensions: function() {
            return {
                minWidth: 6,
                minHeight: 4,
                width: 6,
                height: 4
            };
        }
    }

});


countlyVue.container.registerTab("/analytics/users", {
    priority: 1,
    route: "#/analytics/users/overview",
    name: "overview",
    title: CV.i18n('user-analytics.overview-title'),
    component: UserAnalyticsOverview,
    vuex: []
});

