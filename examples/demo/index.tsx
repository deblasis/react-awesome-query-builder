import React, { useEffect, useState, useCallback } from "react";
import {
  Query, Builder, Utils,
  //types:
  ImmutableTree, Config, BuilderProps, JsonTree, JsonLogicTree, ActionMeta, Actions
} from "react-awesome-query-builder";
import throttle from "lodash/throttle";
import loadConfig from "./config";
import loadedInitLogic from "./init_logic";
//let loadedInitLogic;
import Immutable from "immutable";
import clone from "clone";
import { Alert, Button, Grid, Popover } from "@mui/material";

const stringify = JSON.stringify;
const {elasticSearchFormat, queryBuilderFormat, jsonLogicFormat, queryString, _mongodbFormat, _sqlFormat, _spelFormat, getTree, checkTree, loadTree, uuid, loadFromJsonLogic, loadFromSpel, isValidTree} = Utils;
const preStyle = { backgroundColor: "#d6ebff", margin: "10px", padding: "10px" };
const preErrorStyle = { backgroundColor: "lightpink", margin: "10px", padding: "10px" };
const initialSkin = window._initialSkin || "mui";
const emptyInitValue: JsonTree = {id: uuid(), type: "group"};
const loadedConfig = loadConfig(initialSkin);


export async function copyTextToClipboard(text: string) {
  if ("clipboard" in navigator) {
    return await navigator.clipboard.writeText(text);
  } else {
    return document.execCommand("copy", true, text);
  }
}

// let initValue: JsonTree = loadedInitValue && Object.keys(loadedInitValue).length > 0 ? loadedInitValue as JsonTree : emptyInitValue;
// const initLogic: JsonLogicTree = loadedInitLogic && Object.keys(loadedInitLogic).length > 0 ? loadedInitLogic as JsonLogicTree : undefined;
// let initTree: ImmutableTree;
// //initTree = checkTree(loadTree(initValue), loadedConfig);
// initTree = checkTree(loadFromJsonLogic(initLogic, loadedConfig), loadedConfig); // <- this will work same

// // Trick to hot-load new config when you edit `config.tsx`
// const updateEvent = new CustomEvent<CustomEventDetail>("update", { detail: {
//   config: loadedConfig,
//   _initTree: initTree,
//   _initValue: initValue,
// } });
let initValue: JsonTree;
let initTree: ImmutableTree;

// window.dispatchEvent(updateEvent);

declare global {
  interface Window {
    _initialSkin: string;
  }
}

interface CustomEventDetail {
  config: Config;
  _initTree: ImmutableTree;
  _initValue: JsonTree;
}

interface DemoQueryBuilderState {
  tree: ImmutableTree;
  config: Config;
  skin: string,
  spelStr: string;
  spelErrors: Array<string>;
}

type ImmOMap = Immutable.OrderedMap<string, any>;

interface DemoQueryBuilderMemo {
  immutableTree?: ImmutableTree,
  config?: Config,
  _actions?: Actions,
}

const DemoQueryBuilder: React.FC = () => {
  const memo: DemoQueryBuilderMemo = {};


  // const [state, setState] = useState<DemoQueryBuilderState>({
  //   tree: initTree,
  //   config: loadedConfig,
  //   skin: initialSkin,
  //   spelStr: "",
  //   spelErrors: [] as Array<string>
  // });
  const [state, setState] = useState<DemoQueryBuilderState>({
    tree: initTree,
    config: loadedConfig,
    skin: initialSkin,
    spelStr: "",
    spelErrors: [] as Array<string>
  });

  const [inputJsonLogic, setInputJsonLogic] = useState({});
  const [isImporting, setIsImporting] = useState(false);

  useEffect(()=> {

    const fetchRequirements = async () => {
      const res = await fetch("http://localhost:3000/api/v1/requirements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        //body: JSON.stringify({})
      });

      const values = await res.json() as [];
      return {
        values,
        hasMore: false,
      };
    };

    if (!isEmptyObj(inputJsonLogic)) {
      fetchRequirements().
        then(requirements => {

          //const initValue: JsonTree = loadedInitValue && Object.keys(loadedInitValue).length > 0 ? loadedInitValue as JsonTree : emptyInitValue;
          const initLogic: JsonLogicTree = inputJsonLogic && Object.keys(inputJsonLogic).length > 0 ? inputJsonLogic as JsonLogicTree : undefined;
          const initTree: ImmutableTree = checkTree(loadFromJsonLogic(initLogic, {...loadedConfig, requirements}), loadedConfig); // <- this will work same

          console.log("initTree", initTree);
          // Trick to hot-load new config when you edit `config.tsx`
          const updateEvent = new CustomEvent<CustomEventDetail>("update", { detail: {
            config: loadedConfig,
            _initTree: initTree,
            _initValue: undefined,
          } });

          window.dispatchEvent(updateEvent);

          setState({
            tree: initTree,
            config: loadedConfig,
            skin: initialSkin,
            spelStr: "",
            spelErrors: [] as Array<string>
          });

        }).
        catch(console.error);
    }


  },[inputJsonLogic]);





  useEffect(() => {
    window.addEventListener("update", onConfigChanged);
    return () => {
      window.removeEventListener("update", onConfigChanged);
    };
  });


  const [isCopied, setIsCopied] = useState(false);
  const handleCopyClick = (txt: string) => {
    copyTextToClipboard(txt)
      .then(() => {
        // If successful, update the isCopied state value
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 1500);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleImport = () => {
    setInputJsonLogic(loadedInitLogic);
    setTimeout(()=> {
      setInputJsonLogic({});
    },100);
  };


  const onConfigChanged = (e: Event) => {
    const {detail: {config, _initTree, _initValue}} = e as CustomEvent<CustomEventDetail>;
    console.log("Updating config...");
    setState({
      ...state,
      config,
    });
    initTree = _initTree;
    initValue = _initValue;
  };

  const switchShowLock = () => {
    const newConfig: Config = clone(state.config);
    newConfig.settings.showLock = !newConfig.settings.showLock;
    setState({...state, config: newConfig});
  };

  const resetValue = () => {
    setState({
      ...state,
      tree: initTree,
    });
  };

  const validate = () => {
    setState({
      ...state,
      tree: checkTree(state.tree, state.config)
    });
  };

  const onChangeSpelStr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const spelStr = e.target.value;
    setState({
      ...state,
      spelStr
    });
  };

  const importFromSpel = () => {
    const [tree, spelErrors] = loadFromSpel(state.spelStr, state.config);
    setState({
      ...state,
      tree: tree ? checkTree(tree, state.config) : state.tree,
      spelErrors
    });
  };

  const changeSkin = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const skin = e.target.value;
    const config = loadConfig(e.target.value);
    setState({
      ...state,
      skin,
      config,
      tree: checkTree(state.tree, config)
    });
    window._initialSkin = skin;
  };

  const clearValue = () => {
    setState({
      ...state,
      tree: loadTree(emptyInitValue),
    });
  };

  const renderBuilder = useCallback((bprops: BuilderProps) => {
    memo._actions = bprops.actions;
    return (
      <div className="query-builder-container">
        <div className="query-builder qb-lite">
          <Builder {...bprops} />
        </div>
      </div>
    );
  }, []);

  const onChange = useCallback((immutableTree: ImmutableTree, config: Config, actionMeta?: ActionMeta) => {
    if (actionMeta)
      console.info(actionMeta);
    memo.immutableTree = immutableTree;
    memo.config = config;
    updateResult();
  }, []);

  const updateResult = throttle(() => {
    setState(prevState => ({...prevState, tree: memo.immutableTree, config: memo.config}));
  }, 100);

  const renderResult = ({tree: immutableTree, config} : {tree: ImmutableTree, config: Config}) => {
    const isValid = isValidTree(immutableTree);
    const treeJs = getTree(immutableTree);
    const {logic, data: logicData, errors: logicErrors} = jsonLogicFormat(immutableTree, config);

    return (
      <div>
        <Grid container spacing={2} className="buttons-container">
          <Grid item xs={6} container alignItems="center" justifyContent="center">
            <Button variant="contained" onClick={()=> handleImport()}>Import</Button>
          </Grid>
          <Grid item xs={6} container alignItems="center" justifyContent="center">
            {!!logic &&<Button variant="outlined" onClick={() => handleCopyClick(stringify(logic, undefined, 2))}>Copy to clipboard</Button>}
            <Popover
              open={isCopied}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <Alert severity="success">RequirementExpression copied!</Alert>
            </Popover>
          </Grid>
        </Grid>
        {isValid ? null : <pre style={preErrorStyle}>{"Tree has errors"}</pre>}
        <br />
        {!!logic && <div className="requirement-expression">
          <span className="title">RequirementExpression</span>
          { logicErrors.length > 0
            && <pre style={preErrorStyle}>
              {stringify(logicErrors, undefined, 2)}
            </pre>
          }
          { !!logic
            && <><pre style={preStyle}>
              {/* {"// Rule"}:<br /> */}
              {stringify(logic, undefined, 2)}
            </pre><br /></>
          }
        </div>}
        {/* <hr/>
        <div>
        Tree:
          <pre style={preStyle}>
            {stringify(treeJs, undefined, 2)}
          </pre>
        </div> */}
      </div>
    );
  };

  return (
    <div>
      {/* <div>
        <select value={state.skin} onChange={changeSkin}>
          <option key="vanilla">vanilla</option>
          <option key="antd">antd</option>
          <option key="material">material</option>
          <option key="mui">mui</option>
          <option key="bootstrap">bootstrap</option>
        </select>
        <button onClick={resetValue}>reset</button>
        <button onClick={clearValue}>clear</button>
        <button onClick={runActions}>run actions</button>
        <button onClick={validate}>validate</button>
        <button onClick={switchShowLock}>show lock: {state.config.settings.showLock ? "on" : "off"}</button>
      </div> */}

      <Query
        {...state.config}
        value={state.tree}
        onChange={onChange}
        renderBuilder={renderBuilder}
      />
      <div className="query-builder-result">
        {renderResult(state)}
      </div>
    </div>
  );
};


export default DemoQueryBuilder;


function isEmptyObj (obj: any) {
  return obj
    && Object.keys(obj).length === 0
    && Object.getPrototypeOf(obj) === Object.prototype;
}