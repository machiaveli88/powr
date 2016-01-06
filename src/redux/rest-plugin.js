const actionsSet = {
   LOAD: "LOAD",
   LOAD_SUCCESS: "LOAD_SUCCESS",
   LOAD_FAIL: "LOAD_FAIL",
   SAVE: "SAVE",
   SAVE_SUCCESS: "SAVE_SUCCESS",
   SAVE_FAIL: "SAVE_FAIL",
   RESTORE: "RESTORE",
   RESTORE_SUCCESS: "RESTORE_SUCCESS",
   RESTORE_FAIL: "RESTORE_FAIL",
   REVISION: "REVISION",
   REVISION_SUCCESS: "REVISION_SUCCESS",
   REVISION_FAIL: "REVISION_FAIL",
   DELETE: "DELETE",
   DELETE_SUCCESS: "DELETE_SUCCESS",
   DELETE_FAIL: "DELETE_FAIL",
   LOAD_ONE: "LOAD_ONE",
   LOAD_ONE_SUCCESS: "LOAD_ONE_SUCCESS",
   LOAD_ONE_FAIL: "LOAD_ONE_FAIL",
   LOAD_REVISION: "LOAD_REVISION",
   LOAD_REVISION_SUCCESS: "LOAD_REVISION_SUCCESS",
   LOAD_REVISION_FAIL: "LOAD_REVISION_FAIL",
   SET: "SET",
   PATCH: "PATCH",
   ACTIVATE: "ACTIVATE",
   SAVE_AND_ACTIVATE: "SAVE_AND_ACTIVATE"
};
function types(model) {
   const obj = {};
   Object.keys(actionsSet).map(key=> {
      obj[key] = model.toUpperCase() + "_" + key;
   });
   return obj;
}

// load, save, restore, revision, activate, ...
function actions(name, model) {
   if (!model) {
      model = name;
   }
   const actions = types(name);
   const a = {
      load: function (options = {}) {
         return (dispatch, getState, client) => new Promise((resolve, reject) => {
            dispatch({type: actions.LOAD, ...options});
            client.get('/' + model + '?query={"paranoid":' + !options.includeDeleted + '}').then((result)=> {
               dispatch({type: actions.LOAD_SUCCESS, result: result, ...options});
               resolve({result: result});
            }, (error)=> {
               dispatch({type: actions.LOAD_FAIL, error: error, ...options});
               resolve({error: error});
            });
         });
      },
      loadOne: function (id, activate = true) {
         let query;
         if (typeof id === 'object' && !id.id) {
            query = '/' + model + '?query=' + JSON.stringify({where: id});
         }
         else {
            var id = id.id ? id.id : id;
            if (id.length === 36) {
               query = '/' + model + '/' + id;
            }
            else {
               query = '/' + model + '?query=' + JSON.stringify({where: {ref: id}});
            }
         }
         return (dispatch, getState, client) => new Promise((resolve, reject) => {
            dispatch({type: actions.LOAD_ONE, id: id, activate});
            client.get(query).then((result)=> {
               let data;
               if (Array.isArray(result)) {
                  if (result.length === 0) { // isArray
                     let error = {name: "NotFound", message: "Could not find item " + query};
                     dispatch({type: actions.LOAD_ONE_FAIL, error: error});
                     resolve({error: error});//reject
                     return;
                  }
                  else {
                     data = result[0];
                  }
               }
               else {
                  data = result;
               }
               dispatch({type: actions.LOAD_ONE_SUCCESS, result: data});
               if (activate) {
                  dispatch(a.activate(data));
               }
               resolve({result: data});
            }, (error)=> {
               dispatch({type: actions.LOAD_ONE_FAIL, error: error});
               resolve({error: error});
            });
         });
      },
      loadRevision: function (id, revision, activate = true) {
         return (dispatch, getState, client) => new Promise((resolve, reject) => {
            dispatch({type: actions.LOAD_REVISION, id: id, activate});
            client.get('/revision/' + model + '/' + id + '/' + revision).then((result)=> {
               dispatch({type: actions.LOAD_REVISION_SUCCESS, result: result.document});
               if (activate) {
                  dispatch(a.activate(result.document));
               }
               resolve({result: result.document});
            }, (error)=> {
               dispatch({type: actions.LOAD_REVISION_FAIL, error: error});
               resolve({error: error});
            });
         });
      },
      save: function (item, options = {}) {
         if (options === true) {
            options = {activate: true};
         }
         const f = item.id
            ? (client)=>client.put("/" + model + "/" + item.id, item)
            : (client)=>client.post("/" + model, item);

         return (dispatch, getState, client) => new Promise((resolve, reject) => {
            dispatch({type: actions.SAVE, data: item, ...options});
            f(client).then((result)=> {
               window.addNotification({
                  message: "Dokument wurde gespeichert.",
                  level: "success",
                  title: "Status"
               });
               dispatch({type: actions.SAVE_SUCCESS, result: result, ...options});
               if (options.activate) {
                  dispatch(a.activate(result));
               }
               resolve({result: result});
            }, (error)=> {
               window.addNotification({
                  message: "Fehler beim Speichern.",
                  level: "danger",
                  title: "Fehler"
               });
               dispatch({type: actions.SAVE_FAIL, error: error, ...options});
               resolve({error: error});
            });
         });
      },
      restore: function (item, activate = true) {
         return (dispatch, getState, client) => new Promise((resolve, reject) => {
            dispatch({type: actions.RESTORE, data: item, activate});
            client.put("/" + model + "/" + item.id + "/restore").then(result => {
               window.addNotification({
                  message: "Dokument wurde wiederhergestellt.",
                  level: "success",
                  title: "Status"
               });
               dispatch({type: actions.RESTORE_SUCCESS, result: result});
               if (activate) {
                  dispatch(a.activate(result));
               }
               resolve({result: result});
            }, (error)=> {
               window.addNotification({
                  message: "Fehler beim Wiederherstellen.",
                  level: "danger",
                  title: "Fehler"
               });
               dispatch({type: actions.RESTORE_FAIL, error: error});
               resolve({error: error});
            });
         });
      },
      revision: function (id, revision, activate = true) {
         return (dispatch, getState, client) => new Promise((resolve, reject) => {
            dispatch({type: actions.REVISION, id, revision, activate});
            client.get("/revision/" + model + "/" + id + "/" + revision + "/restore").then((result)=> {
               window.addNotification({
                  message: "Dokument wurde wiederhergestellt.",
                  level: "success",
                  title: "Status"
               });
               dispatch({type: actions.REVISION_SUCCESS, result: result});
               if (activate) {
                  dispatch(a.activate(result));
               }
               resolve({result: result});
            }, (error)=> {
               window.addNotification({
                  message: "Fehler beim Wiederherstellen.",
                  level: "danger",
                  title: "Fehler"
               });
               dispatch({type: actions.REVISION_FAIL, error: error});
               resolve({error: error});
            });
         });
      },
      remove: function (item, activate = true) {
         return (dispatch, getState, client) => new Promise((resolve, reject) => {
            dispatch({type: actions.DELETE, data: item, activate});
            client.delete("/" + model + "/" + item.id, item).then((result)=> {
               window.addNotification({
                  message: "Dokument wurde gelöscht.",
                  level: "success",
                  title: "Status"
               });
               dispatch({type: actions.DELETE_SUCCESS, result: result});
               if (activate) {
                  dispatch(a.activate(null));
               }
               resolve({result: result});
            }, (error)=> {
               window.addNotification({
                  message: "Fehler beim Löschen.",
                  level: "danger",
                  title: "Fehler"
               });
               dispatch({type: actions.DELETE_FAIL, error: error});
               resolve({error: error});
            });
         });
      },
      patch: function (item, patch) {
         return {
            type: actions.PATCH,
            item,
            patch
         };
      },
      setProperty: function (item, property, value) {
         return {
            type: actions.SET,
            item,
            property,
            value
         };
      },
      activate: function (item) {
         return {
            type: actions.ACTIVATE,
            item
         };
      }
   }
   return a;
}

function addOrUpdate(data, result) {
   let newData;
   let flag = true;
   newData = data ? data.map(item => {
      if (item.id === result.id) {
         flag = false;
         return result;
      }
      else {
         return item;
      }
   }) : null;
   if (flag && newData) {
      newData.unshift(result)
   }
   return newData;
}
function reducer(model, initialState, logout) {
   const actions = types(model);
   return function (state, action) {
      if (!action.type) {
         return state;
      }
      if (logout && action.type === logout) {
         return initialState;
      }
      switch (action.type) {
         // BASE
         case actions.LOAD:
         case actions.LOAD_ONE:
         case actions.LOAD_REVISION:
         case actions.REVISION:
         case actions.RESTORE:
         case actions.DELETE:
            return {
               ...state,
               loading: true
            };
         // SUCCESS
         case actions.LOAD_SUCCESS:
            return {
               ...state,
               loading: false,
               loaded: true,
               data: action.result,
               deleted: action.deleted,
               error: null,
               dirty: false
            };
         case actions.SAVE_SUCCESS:
            return {
               ...state,
               loading: false,
               data: addOrUpdate(state.data, action.result),
               // active: action.result.data,
               dirty: false
            };
         case actions.LOAD_REVISION_SUCCESS:
            return {
               ...state,
               loading: false,
               dirty: false
            };
         case actions.REVISION_SUCCESS:
         case actions.RESTORE_SUCCESS:
         case actions.LOAD_ONE_SUCCESS:
            return {
               ...state,
               loading: false,
               data: state.data ? state.data.map(item => (item.id === action.result.id ? action.result : item)) : null,
               active: action.result.data,
               dirty: false
            };
         case actions.DELETE_SUCCESS:
            return {
               ...state,
               loading: false,
               data: state.data ? state.data.filter(item => item.id !== action.result.id) : null,
               dirty: false
            };
         // FAIL
         case actions.LOAD_REVISION_FAIL:
         case actions.LOAD_FAIL:
         case actions.LOAD_ONE_FAIL:
         case actions.SAVE_FAIL:
         case actions.REVISION_FAIL:
         case actions.RESTORE_FAIL:
         case actions.DELETE_FAIL:
            return {
               ...state,
               loading: false,
               error: action.error
            };
         // SET
         case actions.ACTIVATE:
            return {
               ...state,
               active: action.item,
               dirty: false
            };
         case actions.PATCH:
            const oldData = action.item;
            const patchData = action.patch;
            return {
               ...state,
               active: {
                  ...oldData,
                  ...patchData
               },
               dirty: true
            };
         case actions.SET:
            return {
               ...state,
               active: Set(action.item, action.property, action.value),
               dirty: true
            };
         // DEFAULT
         default:
            return state;
      }
   }
}

function Set(obj, path, value) {
   var copy = JSON.parse(JSON.stringify(obj));
   var schema = copy;

   var pList = path.split('.');
   var len = pList.length;
   for (var i = 0; i < len - 1; i++) {
      var elem = pList[i];
      if (!schema[elem]) schema[elem] = {}
      schema = schema[elem];
   }

   schema[pList[len - 1]] = value;
   return copy;
}

export default {
   Reducer: reducer,
   Actions: actions,
   Types: types,
   AddOrUpdate: addOrUpdate
}
