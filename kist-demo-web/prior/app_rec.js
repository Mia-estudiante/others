"use strict";

const express = require('express');
const app = express();
const multer = require('multer');
const fs = require('fs')
const PORT = 8080
const path = require('path');
const axios = require('axios');
const parse = require('csv-parser');

app.set('views', path.join(__dirname, '/public')); //폴더, 폴더경로 지정

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json());                         // Parse JSON bodies
app.use('/static', express.static(__dirname + '/public')); //가상경로, 실제경로

let query_name = ''

/* upload된 query image 저장을 위한 storage */
const storage = multer.diskStorage({
	destination : (req, file, cb) => {
    	cb(null, "public/query/") // file이 저장될 경로
    },
  	filename : (req, file, cb) => {
        const file_name = path.parse(file.originalname)['name']
        const file_ext = path.parse(file.originalname)['ext']
        query_name = file_name + '-' + Date.now() + file_ext
        cb(null, query_name);   //타임스탬프 확장자 형식
    }
})

const uploadFile = multer({ storage : storage })

app.get('/static', (req, res) => {
    res.render('index.html')
})

app.post('/upload', uploadFile.single('upload'), (reqL, resL) => {
    const h_id = reqL.file.originalname.split('.')[0]
    const json_data = {
       'id': h_id
    }

    const query_path = 'public/query'
    const gallery_path = 'public/gallery'

    axios.post('http://127.0.0.1:5000/api/flask/model', json_data)
    .then(res => {
        if (res.data.result) {
            console.log("해당 human id 존재") 
            fs.readdir(`${gallery_path}/${h_id}`, (err, cctv_list) => {
                for (let i=0; i<cctv_list.length; i++) {
                    const data = []
                    const csv_path = `${gallery_path}/${h_id}/${cctv_list[i]}/csv/result.csv`
                    fs.createReadStream(csv_path)
                    .pipe(parse())
                    .on('data', row => {
                        data.push(row)
                    })
                    .on('end', () => {
                        console.log('CSV file successfully read');
                        data.sort((a, b) => parseFloat(b.Acc) - parseFloat(a.Acc));
                        console.log(data);
                      })
                    .on('error', (err) => {
                    console.error('Error reading CSV file:', err);
                    });
                }

                /* html 생성 및 render */
                resL.send("render 중..")
             });
        }
        else {
            console.log("해당 human id 존재 안 함") 
        }
    })
    .catch(err => {
        console.log(err);
    });
  });

app.listen(PORT, () => {
    console.log(`listening on ${PORT} port`)
})

//////////////////////////////////////////////////////////////////////////////

const head = (()=>{
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charset="UTF-8">
       <meta http-equiv="X-UA-Compatible" content="IE=edge">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Re-ID Project</title>
       <link rel="preconnect" href="https://fonts.googleapis.com">
       <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
       <link href="https://fonts.googleapis.com/css2?family=PT+Serif&display=swap" rel="stylesheet">
    </head>
    `
})

const body_header = (() => {
    return `
    <header class="title-container">
    <div>
        <span class="status"></span>
        <h1 class="page-title">결과목록</h1>
    </div>
    </header>
    `
})

const query_container = ((query_path, query_name) => {
    const query_container_header = `
    <header class="query-container-header">
            <div>
                <span class="status"></span>
                <h1 class="query-title">Query Image</h1>
            </div>
        </header>
    `

    const query_person = `
            <ul class="query-list">
            <li class="query-person">
            <img src="${query_path}/${query_name}" alt="">
            <div class="id-info">
                <span class="ped">보행자</span>
                <span class="ped-id">${query_name.split('-')[0]}</span>
            </div>
        </li>
        </ul>
    `

    const attr_container = `
    <ul class="attr">
    <li>
        <span>blue-shirt</span>
        <span>white-pants</span>
    </li>
    <li>
        <span>blue-shirt</span>
        <span>white-pants</span>
    </li>
    </ul>
    `

    return `
    <aside class="query-container">
    ${query_container_header}
    ${query_person}
    ${attr_container}
    </aside>
    `
})

const gallery_container = (cctv_name) => {
    const gallery_container_header = `
    <header class="gallery-container-header">
        <div>
            <span class="status"></span>
            <h1 class="gallery-title">Gallery</h1>
        </div>
    </header>
    `

    const cctv_container_header = `
    <header class="cctv-container-title">
    <h2 class="cctv-id">${cctv_name}</h2>
    <div class="cctv-content">
        <span>2023-04-25</span>
        <span>09:00:27~09:19:32</span>
        <span>00:19:28</span>
        <span>■ 0/10</span>
    </div>
    </header>   
    `

    //gallery 개수 만큼 생성할 것
    const gallery_person = `
    <li class="gallery-person">
    <img src="gallery/${src}" alt="">
    <div class="id-info">
        <span class="ped">보행자</span>
        <span class="ped-id">${data.ID}</span>
        <span class="time">${data.Date}</span>
        <span class="period">${data.Time}</span>
        <span class="map">$${data.Acc}</span>
    </div>
    </li>S
    `
}

// const file_name = 'result.html'

/* 파일 생성 */
const writeToFile = ((file_name, body)=>{
    fs.writeFile(file_name, body, { encoding: 'utf8' }, err => {
        if (err) throw err;
        console.log('HTML file created successfully!');
    })
});