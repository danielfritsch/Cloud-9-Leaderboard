/**
 * File that contains method and class that enable displaying
 * leader's team mangement info in treeview.
 *
 * Contain LeaderDataProvider and LeaderItem class.
 *
 * @file   This files defines the LeaderDataProvider and LeaderItem class.
 * @author AuthorName.
 */

import {
  commands,
  TreeDataProvider,
  TreeItemCollapsibleState,
  ProviderResult,
  TreeItem,
  Event,
  EventEmitter,
  TreeView,
  Disposable,
  window,
} from "vscode";
import {getExtensionContext} from "./Authentication";
import {
  GLOBAL_STATE_USER_TEAM_MEMBERS,
  GLOBAL_STATE_USER_TEAM_ID,
  GLOBAL_STATE_USER_IS_TEAM_LEADER,
} from "./Constants";
import {leaveTeam} from "./Firestore";

/**
 * Class that defines leaderdataprovider wh
 */
export class LeaderDataProvider implements TreeDataProvider<LeaderItem> {
  private _onDidChangeTreeData: EventEmitter<
    LeaderItem | undefined
  > = new EventEmitter<LeaderItem | undefined>();
  readonly onDidChangeTreeData: Event<LeaderItem | undefined> = this
    ._onDidChangeTreeData.event;

  /**
   * Refreshs leader data provider
   */
  refresh(): void {
    const ctx = getExtensionContext();

    const isTeamLeader = ctx.globalState.get(GLOBAL_STATE_USER_IS_TEAM_LEADER);

    if (!isTeamLeader) {
      const teamId = ctx.globalState.get(GLOBAL_STATE_USER_TEAM_ID);
      if (teamId == undefined || teamId == "") {
        this.data = [
          new LeaderItem(
            "No permission: Not in a team yet",
            undefined,
            undefined,
            this,
          ),
        ];
      } else {
        this.data = [
          new LeaderItem(
            "No permission: Not team leader",
            undefined,
            undefined,
            this,
          ),
        ];
      }
    } else {
      const ctx = getExtensionContext();
      const memberMaps: Map<string, Map<string, string>> = ctx.globalState.get(
        GLOBAL_STATE_USER_TEAM_MEMBERS,
      );

      let memberFetchLists = [];

      if (memberMaps !== undefined) {
        for (let [key, value] of Object.entries(memberMaps)) {
          memberFetchLists.push(new LeaderItem("Email: " + key));
        }
      }

      if (memberFetchLists.length === 0) {
        memberFetchLists.push(new LeaderItem("Empty: No team member yet"));
      }

      let removeMemberFetchLists: LeaderItem[] = [];
      let childLeaderItem = new LeaderItem("");

      if (memberMaps !== undefined) {
        for (let [key, value] of Object.entries(memberMaps)) {
          childLeaderItem = new LeaderItem("Remove member: " + key);

          removeMemberFetchLists.push(childLeaderItem);
        }
      }

      if (removeMemberFetchLists.length === 0) {
        removeMemberFetchLists.push(
          new LeaderItem("Empty: No team member yet"),
        );
      }

      let topLeaderItem = new LeaderItem(
        "Remove Team members",
        undefined,
        removeMemberFetchLists,
      );

      for (var val of removeMemberFetchLists) {
        val.parent = topLeaderItem;
      }

      this.data = [
        new LeaderItem("Team members", undefined, memberFetchLists),
        topLeaderItem,
      ];
    }
    this._onDidChangeTreeData.fire(null);
  }

  private view: TreeView<LeaderItem>;
  data: LeaderItem[];

  /**
   * Creates an instance of leader data provider.
   */
  constructor() {
    const ctx = getExtensionContext();
    if (ctx.globalState.get(GLOBAL_STATE_USER_IS_TEAM_LEADER)) {
      let childLeaderItem = new LeaderItem("");

      let topLeaderItem = new LeaderItem("Remove Team members", undefined, [
        childLeaderItem,
      ]);
      childLeaderItem.parent = topLeaderItem;
      this.data = [
        new LeaderItem("Team members", undefined, [new LeaderItem("")]),
        topLeaderItem,
      ];
    } else {
      const teamId = ctx.globalState.get(GLOBAL_STATE_USER_TEAM_ID);
      if (teamId == undefined || teamId == "") {
        this.data = [
          new LeaderItem(
            "No permission: Not in a team yet",
            undefined,
            undefined,
            this,
          ),
        ];
      } else {
        this.data = [
          new LeaderItem(
            "No permission: Not team leader",
            undefined,
            undefined,
            this,
          ),
        ];
      }
    }
  }

  /**
   * Params leader data provider
   * @param menuTreeView
   */
  bindView(menuTreeView: TreeView<LeaderItem>): void {
    this.view = menuTreeView;
  }

  /**
   * Gets children
   * @param [task]
   * @returns children
   */
  getChildren(task?: LeaderItem | undefined): ProviderResult<LeaderItem[]> {
    if (task === undefined) {
      return this.data;
    }
    return task.children;
  }

  /**
   * Gets tree item
   * @param task
   * @returns tree item
   */
  getTreeItem(task: LeaderItem): TreeItem | Thenable<TreeItem> {
    return task;
  }
}

/**
 * Leader item Class that extends TreeItem
 */
export class LeaderItem extends TreeItem {
  children: LeaderItem[] | undefined;
  parent: LeaderItem | undefined;
  upperClass: LeaderDataProvider | undefined;

  /**
   * Creates an instance of leader item.
   * @param label
   * @param [parent]
   * @param [children]
   * @param [upperClass]
   */
  constructor(
    label: string,
    parent?: LeaderItem,
    children?: LeaderItem[],
    upperClass?: LeaderDataProvider,
  ) {
    super(
      label,
      children === undefined
        ? TreeItemCollapsibleState.None
        : TreeItemCollapsibleState.Collapsed,
    );
    this.children = children;
    this.parent = parent;
    this.upperClass = upperClass;
  }
}

/**
 * Connector for leader tree view to extension.
 * Include handler for leader info selector
 * @param view
 */
export const connectCloud9LeaderTreeView = (view: TreeView<LeaderItem>) => {
  return Disposable.from(
    view.onDidChangeSelection(async (e) => {
      if (!e.selection || e.selection.length === 0) {
        return;
      }

      const item: LeaderItem = e.selection[0];

      handleLeaderInfoChangeSelection(view, item);
    }),
  );
};

/**
 * Handler for leader info change selection
 * @param view
 * @param item
 */
export const handleLeaderInfoChangeSelection = (
  view: TreeView<LeaderItem>,
  item: LeaderItem,
) => {
  const ctx = getExtensionContext();
  const memberMaps: Map<string, Map<string, string>> = ctx.globalState.get(
    GLOBAL_STATE_USER_TEAM_MEMBERS,
  );
  if (item.label.startsWith("No permission:")) {
    if (ctx.globalState.get(GLOBAL_STATE_USER_IS_TEAM_LEADER)) {
      let childItem = new LeaderItem("");

      let topItem = new LeaderItem("Remove Team members", undefined, [
        childItem,
      ]);
      childItem.parent = topItem;
      item.upperClass.data = [
        new LeaderItem("Team members", undefined, [new LeaderItem("")]),
        topItem,
      ];
      commands.executeCommand("LeaderView.refreshEntry");
    }
  } else if (item.label === "Team members") {
    if (memberMaps !== undefined) {
      item.children = [];

      for (let [key, value] of Object.entries(memberMaps)) {
        item.children.push(
          new LeaderItem("User: " + memberMaps[key]["name"], item, [
            new LeaderItem(""),
          ]),
        );
      }

      if (item.children.length === 0) {
        item.children.push(new LeaderItem("Empty: No team member yet", item));
      }

      commands.executeCommand("LeaderView.refreshEntry");
    }
  } else if (item.label.startsWith("User: ")) {
    if (memberMaps !== undefined) {
      item.children = [];

      for (let [key, value] of Object.entries(memberMaps)) {
        item.children.push(new LeaderItem("Email: " + key));
      }
      commands.executeCommand("LeaderView.refreshEntry");
    }
  } else if (item.label === "Remove Team members") {
    if (memberMaps !== undefined) {
      item.children = [];
      for (let [key, value] of Object.entries(memberMaps)) {
        item.children.push(new LeaderItem("Remove member: " + key, item));
      }

      if (item.children.length === 0) {
        item.children.push(new LeaderItem("Empty: No team member yet", item));
      }

      commands.executeCommand("LeaderView.refreshEntry");
    }
  } else if (item.label.startsWith("Remove member: ")) {
    if (memberMaps !== undefined) {
      let selectedMemberEmail = item.label.substring(15);

      window
        .showInformationMessage(
          `Are you sure you want to remove ${selectedMemberEmail}?`,
          "yes",
          "no",
        )
        .then((input) => {
          if (input === "yes") {
            const member = memberMaps[selectedMemberEmail];

            const memberId = member["id"];
            const teamId = ctx.globalState.get(GLOBAL_STATE_USER_TEAM_ID);

            leaveTeam(memberId, teamId).then(() => {
              const newMemberMaps = ctx.globalState.get(
                GLOBAL_STATE_USER_TEAM_MEMBERS,
              );
              item.parent.children = [];
              for (let [key, value] of Object.entries(newMemberMaps)) {
                item.parent.children.push(
                  new LeaderItem("Member: " + key, item),
                );
              }

              commands.executeCommand("LeaderView.refreshEntry");
              window.showInformationMessage("Successfully remove");
            });
          } else {
            window.showInformationMessage("Removal canceled");
          }
        });
    }
  }
};
