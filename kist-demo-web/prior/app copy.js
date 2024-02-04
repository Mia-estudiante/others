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
    const gallery_path = 'public/gallery'

    console.log(h_id)
    
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
                        console.log(data);
                        data.sort((a, b) => parseFloat(a.Acc) - parseFloat(b.Acc));
                        console.log("------------ -정렬후-----------------------")
                        console.log(data);
                        // Perform further processing with the data as needed
                        

                        //  else {
                        //     resL.send("not result")
                        // }
                        // fs.writeFile( (err) => {
                        //     if (err) throw err;
                        //     console.log('HTML file created successfully!');
                        //   });


                      })
                    .on('error', (err) => {
                    console.error('Error reading CSV file:', err);
                    });
                }
                console.log(cctv_list);
                const html_str = head()+`<body>`+body_header()+
                `<main class="main-container">`+query_container(query_path, query_name)+gallery_container()+`</main>`
                +`</body>`
                console.log("-==============")
                console.log(html_str)
                console.log("-==============")
                // writeToFile('public/result.html', html_str)
                // resL.sendFile('public/result.html');


                resL.send(html_str)


                // resL.render('result')
                // if (return_value) {
                // resL.render('result.html')
                // } else {
                //     resL.send("no result")
                // }
             });
        }
        else {
            console.log("해당 human id 존재 안 함") 
        }
        // res.render('result.html')


        // resL.send(res.data);
        // console.log(res.data);
        // resL.send(`<img src="${res.data}">`)
    })
    .catch(err => {
        console.log(err);
    });
  });

app.listen(PORT, () => {
    console.log(`listening on ${PORT} port`)
})

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

//query_path: ./static/query, query_name: 
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

const gallery_person = ()`
<li class="gallery-person">
<img src="gallery/${src}" alt="">
<div class="id-info">
    <span class="ped">보행자</span>
    <span class="ped-id">${data.ID}</span>
    <span class="time">${data.Date}</span>
    <span class="period">${data.Time}</span>
    <span class="map">$${data.Acc}</span>
</div>
</li>
`

const gallery_container = (cctv_list) => {
    const gallery_container_header = `
    <header class="gallery-container-header">
                <div>
                    <span class="status"></span>
                    <h1 class="gallery-title">Gallery</h1>
                </div>
            </header>
    `



    let cctv_container_string = ``
    for(let i=0; i<cctv_list.length; i++) {
        cctv_container_string += cctv_container_header(cctv_list[i])
        for (let j=0; j<)
    }
 

    //for문 돌려서 생성


    return `<section class="gallery-container">`+gallery_container_header+`</section>`
}


// const body = (() => {
    
//     const query_container = `
//                 <ul class="query-list">
//                 <li class="query-person">
//                 <img src="query/${file_name}" alt="">
//                 <div class="id-info">
//                     <span class="ped">보행자 ID</span>
//                     <span class="ped-id">${file_name}</span>
//                 </div>
//                 </li>
//                 `
    


   
// })

// const file_name = 'result.html'

// const writeToFile = ((file_name, body)=>{
//     fs.writeFile(file_name, body, { encoding: 'utf8' }, err => {
//         if (err) throw err;
//         console.log('HTML file created successfully!');
//         // res.send('HTML file created successfully');
//     })
// });

const readFromDB = (file_name)=>{
    const path = `gallery/${file_name}`
    fs.readdir(path, (err, filelist) => {
        console.log(filelist);
      })
}