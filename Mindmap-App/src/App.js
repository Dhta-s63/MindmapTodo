import './App.css';
import React, { useState, useEffect} from 'react';
import ReactDOM from "react-dom";
import MindElixir, { E } from "mind-elixir";
import painter from 'mind-elixir/dist/painter';
import PptxGenJS from "pptxgenjs";
import { Button, Form, InputGroup, FormControl } from 'react-bootstrap';
import TodoListDataService from "./services/todo.service";
import Popup from 'reactjs-popup';
import { Scrollbars } from 'react-custom-scrollbars-2';
import mindmaptotodo from './picture/test.gif';
import Fab from '@mui/material/Fab';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { paperClasses } from '@mui/material';
import hotkeys from 'hotkeys-js';
import { Box, ChakraProvider } from "@chakra-ui/react";
import Swal from 'sweetalert2';

var mindstring = '';

var searchOptions = [];

let datajson = '';

let updateCheck = false;

function App() {

  let mind = null;
  let selectnode = null;
  let dbnow = null;
  let dbMindmap = null;

  //สร้างมายแมพ
  useEffect(() => {

    TodoListDataService.getAll()
    .then(response =>{
      if ( response !== null ) {
        dbnow = response.data;
        dbMindmap = response.data;
        var datadb = databaseToJSON(response.data);
        let options = {
          el: "#map",
          direction: MindElixir.LEFT,
          data: datadb,
          draggable: true,
          contextMenu: true,
          toolBar: true,
          nodeMenu: true,
          keypress: true,
          allowUndo: true,
          contextMenuOption: {
            focus: true,
            link: true,
            extend: [
              {
                name: 'Todo Tag',
                onclick: () => {
                  console.log('todotagselectnode ',selectnode)
                  mind.updateNodeTags(selectnode,['Todo'])
                },
              },
              {
                name: 'Delete Tag',
                onclick: () => {
                  console.log('deltagselectnode ',selectnode)
                  mind.updateNodeTags(selectnode,[])
                },
              }
            ],
          },
        }
        mind = new MindElixir(options);

        mind.initSide();
    
        mind.getAllDataString();

        hotkeys('t', function(event, handler) {
          event.preventDefault();
          console.log('todotagselectnode ',selectnode)
          if ( selectnode !== undefined && selectnode !== null ) {
            mind.updateNodeTags(selectnode,['Todo'])
            mind.refresh();
          }
        });

        hotkeys('d', function(event, handler) {
          event.preventDefault();
          console.log('deltodoselectnode ',selectnode)
          if ( selectnode !== undefined && selectnode !== null ) {
            mind.updateNodeTags(selectnode,[])
            mind.refresh();
          }
        });
    
        mind.bus.addListener('operation', operation => {
          
          mindstring = mind.getAllData();

          //เพิ่ม tags Todo
          if (operation.obj.hasOwnProperty('tags') ) { //ตัวมันเองคือ todo title
            if ( operation.name === 'editTags' || operation.name === 'removeNode' || operation.name === 'finishEdit') {
              if ( operation.obj.tags.includes('Todo') || operation.origin.includes('Todo') ) {
                console.log(operation);
                console.log("====Todo Title trigger====")

                let todoObj = [];
                let mindTodo = mind.getAllData();
                todoObj = getAllTodo(mindTodo.nodeData,todoObj);
                console.log(todoObj);
                exportTodo(todoObj)
              }
            }
          } else if ( !operation.obj.hasOwnProperty('root') && operation.obj.parent.hasOwnProperty('tags') ) { //ตัวมันคือ desc พ่อเป็น todo title
            if ( operation.name === 'removeNode' || operation.name === 'finishEdit' ) {
              if ( operation.obj.parent.tags.includes('Todo') ) {
                console.log(operation);
                console.log("====Todo Desc trigger====")

                let todoObj = [];
                let mindTodo = mind.getAllData();
                todoObj = getAllTodo(mindTodo.nodeData,todoObj);
                console.log(todoObj);
                exportTodo(todoObj)
              }
            }
          }
        })

        mind.bus.addListener('selectNode', node => {
          //console.log('selectnode ',node)
          selectnode = node;
          //console.log(mind.container);
          //console.log(document.getElementsByClassName('box')[0]);
          //console.log(E(node.id));
        })

        mind.bus.addListener('unselectNode', node => {
          selectnode = node;
        })
      }
    })
    .catch(e =>{
      console.log(e);
    })
  },[]);

  //get db ทุกๆ 4 วิ โดยจะต้องไม่ได้กดโนดและไม่ได้ทำการอัพเดท db อยู่
  useEffect(() => {
    const interval = setInterval(() => {
      //console.log('check DB every 3 seconds');
      TodoListDataService.getAll()
      .then(response =>{
        
        if(!(JSON.stringify(response.data) === JSON.stringify(dbMindmap)) && selectnode === undefined && updateCheck === false){
          console.log('update Mindmap');
          console.log(response.data)
          dbMindmap = response.data;
          let dbjson = databaseToJSON(response.data);
          mind.nodeData = dbjson.nodeData;
          mind.refresh();

        }
      })
      .catch(e =>{
          console.log(e);
      })
    }, 3000);
  
    return () => clearInterval(interval);
  }, []);

  //Import ไฟล์ JSON แล้ว convert เป็น mindmap
  const importData = (datajson) => {
    console.log("importJSON");
    updateCheck = true; //ยังไม่ให้อัพเดท db ขณะ import ไฟล์ใหม่

    var obj = JSON.parse(datajson);

    let optionsdata = {
      el: "#map",
      direction: MindElixir.LEFT,
      data: obj,
      draggable: true,
      contextMenu: true,
      toolBar: true,
      nodeMenu: true,
      keypress: true, //true 
      allowUndo: true, //ทำ undo, redo manual เอง
      contextMenuOption: {
        focus: true,
        link: true,
        extend: [
          {
            name: 'Todo Tag',
            onclick: () => {
              console.log('todotagselectnode ',selectnode)
              mind.updateNodeTags(selectnode,['Todo'])
            },
          },
          {
            name: 'Delete Tag',
            onclick: () => {
              console.log('deltagselectnode ',selectnode)
              mind.updateNodeTags(selectnode,[])
            },
          }
        ],
      },
    }

    mind = new MindElixir(optionsdata);

    hotkeys('t', function(event, handler) {
      event.preventDefault();
      console.log('todotagselectnode ',selectnode)
      if ( selectnode !== undefined && selectnode !== null ) {
        mind.updateNodeTags(selectnode,['Todo'])
        mind.refresh();
      }
    });

    hotkeys('d', function(event, handler) {
      event.preventDefault();
      console.log('deltodoselectnode ',selectnode)
      if ( selectnode !== undefined && selectnode !== null ) {
        mind.updateNodeTags(selectnode,[])
        mind.refresh();
      }
    });

    mind.initSide();
    mind.getAllDataString();
    mindstring = mind.getAllData();

    //////////////////อัพเดท db ตามไฟล์ที่ import ทันที///////////

    console.log('Update DB from imported file')

    let todoImport = [];
    let mindImport = mind.getAllData();
    todoImport = getAllTodo(mindImport.nodeData,todoImport);
    console.log(todoImport);
    exportTodo(todoImport)

    /////////////////////////////////////////////////////////

    mind.bus.addListener('operation', operation => {

      console.log(operation);
      mindstring = mind.getAllData();

      console.log(operation);
      mindstring = mind.getAllData();

      //เพิ่ม tags Todo
      if (operation.obj.hasOwnProperty('tags') ) { //ตัวมันเองคือ todo title
        if ( operation.name === 'editTags' || operation.name === 'removeNode' || operation.name === 'finishEdit') {
          if ( operation.obj.tags.includes('Todo') || operation.origin.includes('Todo') ) {
            console.log(operation);
            console.log("====Todo Title trigger====")

            let todoObj = [];
            let mindTodo = mind.getAllData();
            todoObj = getAllTodo(mindTodo.nodeData,todoObj);
            console.log(todoObj);
            exportTodo(todoObj)
          }
        }
      } else if ( !operation.obj.hasOwnProperty('root') && operation.obj.parent.hasOwnProperty('tags') ) { //ตัวมันคือ desc พ่อเป็น todo title
        if ( operation.name === 'removeNode' || operation.name === 'finishEdit' ) {
          if ( operation.obj.parent.tags.includes('Todo') ) {
            console.log(operation);
            console.log("====Todo Desc trigger====")

            let todoObj = [];
            let mindTodo = mind.getAllData();
            todoObj = getAllTodo(mindTodo.nodeData,todoObj);
            console.log(todoObj);
            exportTodo(todoObj)
          }
        }
      }

    })
    mind.bus.addListener('selectNode', node => {
      //console.log('selectnode ',node)
      selectnode = node;
    })
    mind.bus.addListener('unselectNode', node => {
      //console.log('selectnode ',node)
      selectnode = node;
    })
  }

  //Export ไปยัง Database
  const exportTodo = (todoData) => {
    updateCheck = true;
    TodoListDataService.deleteAll()
      .then(response => {
        //console.log('Delete old Todo')
        for (var k = 0 ; k < todoData.length ; k++){

          TodoListDataService.create(todoData[k])
            .then(response => {
                console.log('Add ',response.data);
            })
            .catch(e => {
                console.log(e);
            });
        }
        console.log('wait 2 seconds')
        setTimeout(() => { console.log('done');

          TodoListDataService.getAll()
            .then(response => {
              dbMindmap = response.data
              updateCheck = false;
            })
            .catch(e => {
              console.log(e)
            });

        }, 2000);
        //window.alert("Add Todo Completed");
      })
      .catch(e => {
        console.log(e);
        updateCheck = false;
    });
  }

  //แปลง db response.data ทีได้เป็นในรูป mindmap json
  const databaseToJSON = (db) => {
    var dbjson = {
      "nodeData": {
        "id": Date.now()+"root",
        "topic": "Todo",
        "root": true,
        "children": []
      }
    }
    //console.log(dbjson)
    //console.log(db)

    const result = Array.from(new Set(db.map(s => s.title)))
    .map(titles => {
      var desctemp = [];
      var arraytemp = db.filter(s => s.title === titles).map(a => a.description);
      for (let i = 0 ; i < arraytemp.length ; i++) {
        if (arraytemp[i] == null) {

        } else {
          desctemp.push({
            "topic": arraytemp[i],
            "id": Date.now()+arraytemp[i].replace(/ /g,"_")
          })
        }
      }
      return {
        topic: titles,
        id: Date.now()+titles.replace(/ /g,"_"),
        tags: ['Todo'],
        children: desctemp
      }
    })
    //console.log('node add from db',result);
    dbjson.nodeData.children = result;
    //console.log('Mindmap ',dbjson);
    return dbjson;
  }

  //แปลง Mindmap เป็น Todo เฉพาะที่มี tags 'Todo'
  const getAllTodo = (obj,objArray) => {

    for (var i = 0 ; i < obj.children.length ; i++){ //ไล่ทุกลูกของ root => Title Todo

      //console.log(obj.children[i].topic)

      if ( obj.children[i].hasOwnProperty('tags') ) {
        for ( var j = 0 ; j < obj.children[i].tags.length ; j++) {
          if ( obj.children[i].tags[j] === 'Todo' ) {
            if ( !obj.children[i].hasOwnProperty('children') || obj.children[i].children.length === 0){  //ถ้าไม่มีลูกต่อ (Desc) ให้สร้างรายการเลย

              var tododata = 
              {
                title: obj.children[i].topic,
                description: null,
                published: false,
                priority: false,
                duedate: null
              }
              objArray.push(tododata);

            } else {

              for (var j = 0 ; j < obj.children[i].children.length ; j++){

                var tododata = 
                {
                  title: obj.children[i].topic,
                  description: obj.children[i].children[j].topic,
                  published: false,
                  priority: false,
                  duedate: null
                }
                objArray.push(tododata);
                //console.log(tododata);

              }
            }
            break;
          }
        }
      }
    }
    return objArray;
  }

  //Choose File
  const readJSON = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = e => {
      console.log("readJSON file")
      console.log(e.target.result)
      //console.log("e.target.result", e.target.result);
      datajson = e.target.result;
      importData(datajson);
    };
  };

  const goToNode = (width,heigth) => {
    //console.log(mind.container)
    //console.log(10000-(mind.container.offsetWidth/2),10000-(mind.container.offsetHeight/2))
    mind.container.scrollTo(
      width-906.5,
      heigth-271
    )
  }

  var searchString = '';
  var searchTemp = '';
  var retrieveId = [];
  var lastIdCheck = false;
  var foundId = false;

  const searchNode = (e) => {
    e.preventDefault();

    if (searchString === ''){ //ไม่ใส่อะไรในช่องเซิช
      Swal.fire({
        title : 'Alert',
        text : 'Please fill in the search',
        icon : 'warning',
        timer : 2500,
      })
      searchTemp = '';
      return;
    }
    if (searchString !== searchTemp){ //เซิชคำใหม่ รีทั้งหมด
      console.log(searchString, searchTemp)
      console.log('แก้คำใหม่ เซิชใหม่')
      foundId = false;
      lastIdCheck = false;
    }

    console.log(retrieveId);
    let allMind = mind.getAllData();

    if (foundId === false && lastIdCheck === false){ //เริ่มเซิชใหม่
      console.log('เริ่มเซิชใหม่')
      retrieveId = [];
      searchData(allMind.nodeData,searchString);
      searchTemp = searchString;
      console.log(retrieveId);
    }

    if (foundId === false){ //ไม่เจอเลย
      Swal.fire({
        title : 'Are you sure?',
        text : searchString + ' not found',
        icon : 'question',
        timer : 2500,
      })
      lastIdCheck = false;
      searchString = '';
    } else { //เจออยู่ก็ไปหาโนดนั้นๆ

      mind.selectNode(E(retrieveId[0]))

      let xystring = E(retrieveId[0]).parentElement.parentElement.getAttribute('style');

      if ( xystring == null ){
        xystring = E(retrieveId[0]).parentElement.parentElement.parentElement.parentElement.getAttribute('style');
      }

      let stringsplit = xystring.split(' ')

      var wpointcheck = false;
      var hpointcheck = false;
      var heigthsplit = stringsplit[1]
      var widthsplit = stringsplit[3]

      if (stringsplit[1].includes('.')){
        heigthsplit = stringsplit[1].split('.')
        heigthsplit = heigthsplit[0]
        hpointcheck = true;
      }
      if (stringsplit[3].includes('.')){
        widthsplit = stringsplit[3].split('.')
        widthsplit = widthsplit[0]
        wpointcheck = true;
      }
      else{
        heigthsplit = stringsplit[1];
        widthsplit = stringsplit[3];
      }
      
      var heightNum = heigthsplit.match(/\d/g).join("");
      var widthNum = widthsplit.match(/\d/g).join("");

      if (hpointcheck){
        heightNum += '.5'
      }
      if (wpointcheck){
        widthNum += '.5'
      }

      goToNode(widthNum,heightNum)
    }
  }

  const searchData = (obj,text) => {

    //console.log(obj.topic,text)
    let topicLower = obj.topic.toLowerCase();
    let textLower = text.toLowerCase();
    
    if (topicLower.match(textLower)) {
      //console.log(obj.id)
      retrieveId.push(obj.id);
      foundId = true;

    } else if (!('children' in obj) || obj.children.length === 0){
      return;

    } else {
      for (let i = 0 ; i < obj.children.length ; i++){
        searchData(obj.children[i],text)
      }
    }
  }

  //Export JSON
  const exportData = () => {
    mindstring = mind.getAllData();
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(mindstring)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "data.json";

    link.click();
  };

  //Export Image
  const paint = () => {
    painter.exportPng(mind,'picture');
  }

  const handleChange = (event) => {
    if(event.target.value === undefined) {
      searchString = '';
    }
    else{
      searchString = event.target.value;
    }
    console.log("handleChange : " + searchString);
  }

  const handleOnChange = (e, value) => {
    if(value === null) {
      searchString = '';
    }
    else{
      searchString = value;
    }
    console.log("handleOnChange : " + value);
  }
  const createOptions = (mindmapData) => {
    console.log("Create search options");
    
    if (!('children' in mindmapData) || mindmapData.children.length === 0){

      return;

    } else {
      
      //console.log(mindmapData.topic);
      for (var i = 0 ; i < mindmapData.children.length ; i++){       
        searchOptions.push(mindmapData.children[i].topic)
      }

      console.log(searchOptions);

      for (var j = 0 ; j < mindmapData.children.length ; j++){
        createOptions(mindmapData.children[j]);
      }

    }
  }
  
  const checkOptionsData = () => {
    TodoListDataService.getAll()
    .then(response =>{
      //console.log(response.data);
      dbMindmap = response.data;
      let dbjson = databaseToJSON(response.data);
      mind.nodeData = dbjson.nodeData;
      console.log(mind.nodeData);
      searchOptions = createOptions(mind.nodeData);
      mind.refresh();     
    })
  }

  useEffect(() => {
    console.log("Create options");
    checkOptionsData();
  },[]);

  return (
    <>
    <div>
      <Form.Group controlId="formFile" className="mb-3">
        <Form.Label>Import JSON File</Form.Label>
        <Form.Control type="file" onChange={readJSON} style={{width : 500}}/>
      </Form.Group>
    </div>
    <div >
      <div className = "button" style={{marginBottom : "10px"}}>
        <Button variant="outline-secondary" onClick={() => paint()}>Export PNG</Button>{' '}
        <Button variant="outline-success" onClick={() => exportData()}>Export JSON</Button>{' '}
      </div>
      <div  class = "input-group" style = {{marginBottom : "10px"}}>
        <Autocomplete
          id = "searchbar"
          sx = {{ width : 300}}
          options = {searchOptions}
          onChange={(e, values) => {handleOnChange(e, values)}}
          onInputChange = {handleChange}
          values = {searchString}
          renderInput = {(params) => <TextField {...params} label = "Search"/>}
        />
        <button 
          id="search-button" 
          class="btn btn-outline-primary" 
          onClick={(e)=>searchNode(e)}>
            Search
         </button>
      </div>
      <Popup
        trigger={<Fab
            sx={{
              position: "fixed",
              bottom: (theme) => theme.spacing(7),
              right: (theme) => theme.spacing(2)
            }}
            color = "primary"
    >
          <QuestionMarkIcon />
          </Fab>} modal>
          <div className='container'>
            <div style={{fontWeight: 'bold', textAlign: 'center', marginTop: '15px', fontSize: '25px'}}> Create Mindmap and link it to Todo application </div>
            <div style ={{textAlign: 'center', marginBottom: '15px'}}>
              <br />
              การจะสร้าง Todolist จาก Mindmap มีขั้นตอนตามตัวอย่างด้านล่าง
              <br />
              <img src={mindmaptotodo} style={{height:'400px', margin: '15px'}}></img>
            </div>
          </div>
      </Popup>
    </div>
    <div id="map" style={{ height: "600px", width: "100%" }} />
    </>
  );
}

export default App;