"use strict";

const express = require('express');
const app = express();
const multer = require('multer');
const fs = require('fs')
const PORT = 8080
// const cors = require('cors');
const path = require('path');
const axios = require('axios');
const parse = require('csv-parser');
// const parser = parse({columns: true}, function (err, records) {
// 	console.log(records);
// });


// app.set('views', __dirname + '/public/views');  // public 안에 views 폴더 안을 지정
app.engine('html', require('ejs').renderFile);  
// app.engine('ejs', require('ejs').__express);
app.set('view engine', 'html');


// app.set('view engine', 'ejs'); //'ejs'탬플릿을 엔진으로 한다.
app.set('views', path.join(__dirname, '/public')); //폴더, 폴더경로 지정


const { METHODS } = require('http');

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json());                         // Parse JSON bodies
app.use('/static', express.static(__dirname + '/public')); //가상경로, 실제경로

let query_name = ''

const storage = multer.diskStorage({
	destination : (req, file, cb) => {
    	cb(null, "public/query/") // file이 저장될 경로
    },
  	filename : (req, file, cb) => {
        const file_name = path.parse(file.originalname)['name']
        const file_ext = path.parse(file.originalname)['ext']
        query_name = file_name + '-' + Date.now() + file_ext
        cb(null, query_name); //타임스탬프 확장자 형식
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

    const query_path = 'static/query'
    const gallery_path = 'static/gallery'
    const gallery_path_ = 'public/gallery'

    axios.post('http://127.0.0.1:5000/api/flask/model', json_data)
    .then(res => {
        if (res.data.result) {
            const html_str = 
            head()+`<body>`+body_header()+
            `<main class="main-container">`+query_container(query_path, query_name)+ gallery_container(gallery_path, gallery_path_, h_id)+`</main>`
            +`</body>`+`</html>`
            // console.log(html_str)
            resL.send(html_str)
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

const cctv_container_header = (cctv_name) => {
    return `
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
}

function returnPromiseGalleryPerson(gallery_string, gallery_path, h_id, cctv_name, img_list, data) {
    return new Promise((resolve, reject) => {
        let img_name = ''
        for(let i=0; i<img_list.length; i++) {
            if (img_list[i].includes(data.ID)) {
                img_name += img_list[i]
                break
            }
        }
        const result = `
        <li class="gallery-person">
        <img src="${gallery_path}/${h_id}/${cctv_name}/img/${img_name}" alt="">
        <div class="id-info">
            <span class="ped">보행자</span>
            <span class="ped-id">${data.ID}</span>
            <span class="time">${data.Date}</span>
            <span class="period">${data.Time}</span>
            <span class="map">${data.Acc}</span>
        </div>
        </li>
        `
        
        gallery_string+=result
        console.log(gallery_string)
        resolve(gallery_string)
    })
}

const gallery_person = (gallery_path, h_id, cctv_name, img_list, data) => {
    let img_name = ''
    for(let i=0; i<img_list.length; i++) {
        if (img_list[i].includes(data.ID)) {
            img_name += img_list[i]
            break
        }
    }
    const result = `
    <li class="gallery-person">
    <img src="${gallery_path}/${h_id}/${cctv_name}/img/${img_name}" alt="">
    <div class="id-info">
        <span class="ped">보행자</span>
        <span class="ped-id">${data.ID}</span>
        <span class="time">${data.Date}</span>
        <span class="period">${data.Time}</span>
        <span class="map">${data.Acc}</span>
    </div>
    </li>
    `
    console.log(result)
    return result
}

const make_cctv_container = async (gallery_path, gallery_path_, h_id)=> {
    let cctv_containers_list = ''
    fs.readdir(`${gallery_path_}/${h_id}`, (err, cctv_list) => {
        for (let i=0; i<cctv_list.length; i++) {
            let data = []
            let cctv_container = `<article class="cctv-container">`+cctv_container_header(cctv_list[i])
            let gallery_string = `<ul class="gallery-list">`
            fs.readdir(`${gallery_path_}/${h_id}/${cctv_list[i]}/img`, (err, img_list) => {
                const csv_path = `${gallery_path_}/${h_id}/${cctv_list[i]}/csv/result.csv`
                fs.createReadStream(csv_path)
                    .pipe(parse())
                    .on('data', row => {
                        data.push(row)
                    })
                    .on('end', async () => {
                        data.sort((a, b) => parseFloat(a.Acc) - parseFloat(b.Acc));
                        for (let j=0; j<data.length; j++) {
                            await returnPromiseGalleryPerson(gallery_string, gallery_path, h_id, cctv_list[i], img_list, data[j])
                            console.log(gallery_string)
                        
                        }
                        gallery_string+=`</ul>`
                        // cctv_container+=gallery_string + `</article>`
                        // cctv_containers_list+=cctv_container
                        // return cctv_containers_list
                    })
                    .on('error', (err) => {
                    console.error('Error reading CSV file:', err);
                    });
                })
        }
    });
}

function returnPromise(container_string, gallery_path, gallery_path_, h_id) {
    return new Promise((resolve, reject) => {
        let cctv_containers_list = ''
        fs.readdir(`${gallery_path_}/${h_id}`, (err, cctv_list) => {
            for (let i=0; i<cctv_list.length; i++) {
                let data = []
                let cctv_container = `<article class="cctv-container">`+cctv_container_header(cctv_list[i])
                let gallery_string = `<ul class="gallery-list">`
                fs.readdir(`${gallery_path_}/${h_id}/${cctv_list[i]}/img`, (err, img_list) => {
                    const csv_path = `${gallery_path_}/${h_id}/${cctv_list[i]}/csv/result.csv`
                    fs.createReadStream(csv_path)
                        .pipe(parse())
                        .on('data', row => {
                            data.push(row)
                        })
                        .on('end', async () => {
                            data.sort((a, b) => parseFloat(a.Acc) - parseFloat(b.Acc));
                            for (let j=0; j<data.length; j++) {
                                await returnPromiseGalleryPerson(gallery_string, gallery_path, h_id, cctv_list[i], img_list, data[j])
                            }
                            gallery_string+=`</ul>`
                            console.log(gallery_string)
                            // cctv_container+=gallery_string + `</article>`
                            // cctv_containers_list+=cctv_container
                            // return cctv_containers_list
                        })
                        .on('error', (err) => {
                        console.error('Error reading CSV file:', err);
                        });
                        
                    })
                // gallery_string+=`</ul>`
                // cctv_container+=gallery_string + `</article>`
                // cctv_containers_list+=cctv_container    
                // console.log(cctv_container)
            }
            // console.log(cctv_containers_list)
            // resolve(cctv_containers_list)
        });
    })
}

const head = (()=>{
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charset="UTF-8">
       <meta http-equiv="X-UA-Compatible" content="IE=edge">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Re-ID Project</title>
       <link rel="stylesheet" href="/static/main.css">
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
            <img src="${query_path}/${query_name}" alt="query_person_pedestrian">
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
    return `<aside class="query-container">`+query_container_header+query_person+attr_container+`</aside>`
})

const gallery_container = async (gallery_path, gallery_path_, h_id) => {
    const gallery_container_header = `
    <header class="gallery-container-header">
                <div>
                    <span class="status"></span>
                    <h1 class="gallery-title">Gallery</h1>
                </div>
            </header>
    `
    let container_string = ''
    // let result = ''
    const result = await returnPromise(container_string,gallery_path, gallery_path_, h_id)
    console.log(container_string)
    // .then(value => {
    //     result = `<section class="gallery-container">`+gallery_container_header+`<div>`+value+`</div>`+`</section>`
    //     console.log(result)
    //     return result
    // })
    // console.log(result)
    // return result
}