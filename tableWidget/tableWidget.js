define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "esri/opsdashboard/WidgetProxy",
  "dojo/store/Memory",
  "dojo/store/Observable",
  "esri/tasks/query",
  "dgrid/OnDemandGrid",
  "dojo/text!./TableWidgetTemplate.html"
], function (declare, lang, _WidgetBase,
             _TemplatedMixin, WidgetProxy, Memory, Observable,
             Query, Grid, templateString) {
  return declare("TableWidget", [_WidgetBase, _TemplatedMixin,
    WidgetProxy], {

    templateString: templateString,

    hostReady: function () {

      // Create the store you will use to display the features in the grid
      this.store = new Observable(new Memory());

      // Get from the data source and the associated data source config
      // The dataSourceConfig stores the fields selected by the operation view publisher during configuration
      var dataSource = this.dataSourceProxies[0];
      var dataSourceConfig = this.getDataSourceConfig(dataSource);

      // Build a collection of fields that you can display
      var fieldsToQuery = [];
      var columns = [];
      dataSourceConfig.selectedFieldsNames.forEach(function (field) {
        columns.push({field: field});
      });

      // Create the grid
      this.grid = new Grid({
        store: this.store,
        cleanEmptyObservers: false,
        columns: columns
      }, this.gridDiv);

      this.grid.startup();

      // Create the query object
      fieldsToQuery = dataSourceConfig.selectedFieldsNames.slice();
      if (fieldsToQuery.indexOf(dataSource.objectIdFieldName) === -1)
        fieldsToQuery.push(dataSource.objectIdFieldName);

      this.query = new Query();
      this.query.outFields = fieldsToQuery;
      this.query.returnGeometry = false;
    },

    dataSourceExpired: function (dataSource, dataSourceConfig) {

      // Execute the query. A request will be sent to the server
      // to query for the features.
      // The results are in the featureSet
      dataSource.executeQuery(this.query).then(lang.hitch(this, function (featureSet) {

        // Show the name of the data source and the number of features
        // returned from the query
        this.updateDataSourceInfoLabel(dataSource.name, featureSet);

        // Show the features in the table
        this.updateAttributeTable(featureSet, dataSource);
      }));
    },

    updateDataSourceInfoLabel: function (dataSourceName, featureSet) {

      // Compose the correct string to display
      var dataSourceInfo = dataSourceName;
      var featureCount = featureSet.features.length;
      if (featureCount === 0)
        dataSourceInfo += " has no feature";
      else
        dataSourceInfo += " has " + featureCount + " features";

      this.infoLabel.innerHTML = dataSourceInfo;
    },

    updateAttributeTable: function (featureSet, dataSource) {
      // For each feature put them in the store and overwrite any existing
      featureSet.features.forEach(lang.hitch(this, function (feature) {
        this.store.put(feature.attributes,
          {overwrite: true, id: feature.attributes[dataSource.objectIdFieldName]});
      }));
    }
  });
});