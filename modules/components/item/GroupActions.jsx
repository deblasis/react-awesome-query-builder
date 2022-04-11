import React, { PureComponent } from "react";

const groupActionsPositionList = {
  topLeft: "group--actions--tl",
  topCenter: "group--actions--tc",
  topRight: "group--actions--tr",
  bottomLeft: "group--actions--bl",
  bottomCenter: "group--actions--bc",
  bottomRight: "group--actions--br"
};
const defaultPosition = "topRight";


export class GroupActions extends PureComponent {
  render() {
    const {
      config,
      addRule, addReq, addGroup, removeSelf, setLock, isLocked, isTrueLocked, id,
      canAddGroup, canAddRule, canAddReq, canDeleteGroup
    } = this.props;
    const {
      immutableGroupsMode, addRuleLabel, addReqLabel, addGroupLabel, delGroupLabel, groupActionsPosition,
      renderButton: Btn, renderSwitch: Switch, renderButtonGroup: BtnGrp,
      lockLabel, lockedLabel, showLock, canDeleteLocked,
    } = config.settings;
    const position = groupActionsPositionList[groupActionsPosition || defaultPosition];

    const setLockSwitch = showLock && !(isLocked && !isTrueLocked) && <Switch
      type="lock" id={id} value={isLocked} setValue={setLock} label={lockLabel} checkedLabel={lockedLabel} config={config}
    />;

    const addRuleBtn = !immutableGroupsMode && canAddRule && !isLocked && <Btn
      type="addRule" onClick={addRule} label={addRuleLabel} readonly={isLocked} config={config}
    />;
    const addReqBtn = !immutableGroupsMode && canAddReq && !isLocked && <Btn
      type="addRule" onClick={addReq} label={addReqLabel} readonly={isLocked} config={config}
    />;
    const addGroupBtn = !immutableGroupsMode && canAddGroup && !isLocked && <Btn
      type="addGroup" onClick={addGroup} label={addGroupLabel} readonly={isLocked} config={config}
    />;
    const delGroupBtn = !immutableGroupsMode && canDeleteGroup && (!isLocked || isLocked && canDeleteLocked) && <Btn
      type="delGroup" onClick={removeSelf} label={delGroupLabel} config={config}
    />;

    return (
      <div className={`group--actions ${position}`}>
        <BtnGrp config={config}>
          {setLockSwitch}
          {addReqBtn}
          {addRuleBtn}
          {addGroupBtn}
          {delGroupBtn}
        </BtnGrp>
      </div>
    );
  }
}
