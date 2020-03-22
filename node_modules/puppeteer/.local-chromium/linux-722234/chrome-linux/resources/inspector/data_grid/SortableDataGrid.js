export default class SortableDataGrid extends DataGrid.ViewportDataGrid{constructor(columnsArray,editCallback,deleteCallback,refreshCallback){super(columnsArray,editCallback,deleteCallback,refreshCallback);this._sortingFunction=DataGrid.SortableDataGrid.TrivialComparator;this.setRootNode((new DataGrid.SortableDataGridNode()));}
static TrivialComparator(a,b){return 0;}
static NumericComparator(columnId,a,b){const aValue=a.data[columnId];const bValue=b.data[columnId];const aNumber=Number(aValue instanceof Node?aValue.textContent:aValue);const bNumber=Number(bValue instanceof Node?bValue.textContent:bValue);return aNumber<bNumber?-1:(aNumber>bNumber?1:0);}
static StringComparator(columnId,a,b){const aValue=a.data[columnId];const bValue=b.data[columnId];const aString=aValue instanceof Node?aValue.textContent:String(aValue);const bString=bValue instanceof Node?bValue.textContent:String(bValue);return aString<bString?-1:(aString>bString?1:0);}
static Comparator(comparator,reverseMode,a,b){return reverseMode?comparator(b,a):comparator(a,b);}
static create(columnNames,values){const numColumns=columnNames.length;if(!numColumns){return null;}
const columns=([]);for(let i=0;i<columnNames.length;++i){columns.push({id:String(i),title:columnNames[i],width:columnNames[i].length,sortable:true});}
const nodes=[];for(let i=0;i<values.length/numColumns;++i){const data={};for(let j=0;j<columnNames.length;++j){data[j]=values[numColumns*i+j];}
const node=new DataGrid.SortableDataGridNode(data);node.selectable=false;nodes.push(node);}
const dataGrid=new DataGrid.SortableDataGrid(columns);const length=nodes.length;const rootNode=dataGrid.rootNode();for(let i=0;i<length;++i){rootNode.appendChild(nodes[i]);}
dataGrid.addEventListener(DataGrid.DataGrid.Events.SortingChanged,sortDataGrid);function sortDataGrid(){const nodes=dataGrid.rootNode().children;const sortColumnId=dataGrid.sortColumnId();if(!sortColumnId){return;}
let columnIsNumeric=true;for(let i=0;i<nodes.length;i++){const value=nodes[i].data[sortColumnId];if(isNaN(value instanceof Node?value.textContent:value)){columnIsNumeric=false;break;}}
const comparator=columnIsNumeric?DataGrid.SortableDataGrid.NumericComparator:DataGrid.SortableDataGrid.StringComparator;dataGrid.sortNodes(comparator.bind(null,sortColumnId),!dataGrid.isSortOrderAscending());}
return dataGrid;}
insertChild(node){const root=(this.rootNode());root.insertChildOrdered(node);}
sortNodes(comparator,reverseMode){this._sortingFunction=DataGrid.SortableDataGrid.Comparator.bind(null,comparator,reverseMode);this.rootNode().recalculateSiblings(0);this.rootNode()._sortChildren(reverseMode);this.scheduleUpdateStructure();}}
export class SortableDataGridNode extends DataGrid.ViewportDataGridNode{constructor(data,hasChildren){super(data,hasChildren);}
insertChildOrdered(node){this.insertChild(node,this.children.upperBound(node,this.dataGrid._sortingFunction));}
_sortChildren(){this.children.sort(this.dataGrid._sortingFunction);for(let i=0;i<this.children.length;++i){this.children[i].recalculateSiblings(i);}
for(const child of this.children){child._sortChildren();}}}
self.DataGrid=self.DataGrid||{};DataGrid=DataGrid||{};DataGrid.SortableDataGrid=SortableDataGrid;DataGrid.SortableDataGridNode=SortableDataGridNode;