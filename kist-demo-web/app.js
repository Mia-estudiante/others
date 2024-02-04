"use strict";

const express = require('express');
const app = express();
const multer = require('multer');
const fs = require('fs')
const PORT = 8080
const path = require('path');
const axios = require('axios');
const parse = require('csv-parser');

app.engine('html', require('ejs').renderFile);  
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '/public')); //폴더, 폴더경로 지정

app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json());                         // Parse JSON bodies
app.use('/static', express.static(__dirname + '/public')); //가상경로, 실제경로

let query_name = ''
const storage = multer.diskStorage({
	destination : (req, file, cb) => {
    	cb(null, "public/model_dynamic/query/") // file이 저장될 경로
    },
  	filename : (req, file, cb) => {
        const file_name = path.parse(file.originalname)['name']
        const file_ext = path.parse(file.originalname)['ext']
        query_name = file_name + '-' + Date.now() + file_ext
        cb(null, query_name); //타임스탬프 확장자 형식
    }
})

const uploadFile = multer({ storage : storage })

//1. 메인 메뉴창 띄우기
app.get('/main', (req, res) => {
    res.render('views\/html\/index.html')
})

//1-1. 모델 연결(데모)
app.get('/connect/upload', (req, res) => {
    res.render('views\/html\/model_dynamic\/index.html')
})

//1-2. Market1501 
// app.get('/market1501', (req, res) => {

// 1-3. 모델 띄우기(static)
app.post('/reid/list', (req, res) => {
    fs.readdir(`public/models_static/`, (err, model_list) => {
        let json = new Object();
        json.model_list = model_list
        res.json(json)
    })
})

app.post('/reid/list/:model_name', (req, res) => {
    const model_name = req.params.model_name
    const QUERY_PATH = `public/models_static/${model_name}/${model_name}/results_csv/market1501/`
    console.log(QUERY_PATH)
    fs.readdir(QUERY_PATH, (err, query_list) => {
        let json = new Object();
        json.query_list = query_list
        res.json(json)
    })
})

app.get('/reid/:model_name/:query_name', (req, res) => {
    const model_name = req.params.model_name
    const query_name = req.params.query_name
    const HTML_PATH = `views/html/models_static/${model_name}/${query_name}.html`
    res.render(HTML_PATH)
})

app.post('/connect', uploadFile.single('upload'), (reqL, resL) => {
    const h_id = reqL.file.originalname.split('.')[0]
    const json_data = {
       'id': h_id
    }

    const query_path = 'static/model_dynamic/query'
    const gallery_path = 'static/model_dynamic/gallery'
    const gallery_path_ = 'public/model_dynamic/gallery'

    axios.post('http://127.0.0.1:5000/api/flask/model', json_data)
    .then(res => {
        if (res.data.result) {
            const html_str = head()+`<body>`+body_header()+
            `<main class="main-container">`+query_container(query_path, query_name)
            return html_str
        }
        else {
            console.log("해당 human id 존재 안 함") 
        }
    }).then(html_str => {
        make_cctv_container(gallery_path, gallery_path_, h_id)
        .then(cctv_str => {
            cctv_str += `</main></body></html>`
            return html_str+cctv_str
        })
        .then(html_str => {
            resL.send(html_str)
        })
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

function returnPromiseIMG(gallery_path, h_id, cctv_name, img_list, gallery) {
    return new Promise((resolve, reject) => {
        let img_name = ''
        for(let i=0; i<img_list.length; i++) {
            if (img_list[i].includes(gallery.ID)) {
                img_name += img_list[i]
                break
            }
        }

        const result = `
        <li class="gallery-person">
            <img src="${gallery_path}/${h_id}/${cctv_name}/img/${img_name}" alt="">
            <div class="id-info">
                <span class="ped">보행자</span>
                <span class="ped-id">${gallery.ID}</span>
                <span class="time">${gallery.Date}</span>
                <span class="period">${gallery.Time}</span>
                <span class="map">${gallery.Acc}</span>
            </div>
        </li>
        `
        resolve(result)
    })
}

function returnPromiseCCTV(gallery_path, gallery_path_, h_id, cctv_name) {
    return new Promise((resolve, reject) => {
        let cctv_container = `<article class="cctv-container">`+cctv_container_header(cctv_name)
        let gallery_string = `<ul class="gallery-list">`
        fs.readdir(`${gallery_path_}/${h_id}/${cctv_name}/img`, (err, img_list) => {
            let gallery_list = []
            const csv_path = `${gallery_path_}/${h_id}/${cctv_name}/csv/result.csv`
            fs.createReadStream(csv_path)
            .pipe(parse())
            .on('data', row => {
                gallery_list.push(row)
            })
            .on('end', async () => {
                gallery_list.sort((a, b) => parseFloat(b.Acc) - parseFloat(a.Acc));
                Promise.all(
                    gallery_list.map((gallery) => {
                        return returnPromiseIMG(gallery_path, h_id, cctv_name, img_list, gallery);
                    })
                )
                .then(li_list => {
                    li_list = li_list.join('')
                    gallery_string+=li_list +`</ul>`+`</article>`
                    cctv_container+=gallery_string
                    resolve(cctv_container) // article이 반환
                })
            })
            .on('error', (err) => {
                console.error('Error reading CSV file:', err);
            });
        })
    })
}

const gallery_container_header = () => {
    return `
    <header class="gallery-container-header">
        <div>
            <span class="status"></span>
            <h1 class="gallery-title">Gallery</h1>
        </div>
    </header>
    `
}

const make_cctv_container = (gallery_path, gallery_path_, h_id)=> {
    return new Promise((resolve, reject) => {
        let result = `<section class="gallery-container">`+gallery_container_header()+`<div>`
        fs.readdir(`${gallery_path_}/${h_id}`, (err, cctv_list) => {
            Promise.all(
                cctv_list.map((cctv_name) => {
                    return returnPromiseCCTV(gallery_path, gallery_path_, h_id, cctv_name);
                })
            )
            .then(cctv_container => {
                result += cctv_container.join('')+`</div>`+`</section>`
                resolve(result)
            })
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
        <link rel="stylesheet" href="/static/views/style/result.css">
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
