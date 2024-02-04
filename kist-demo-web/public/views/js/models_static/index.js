const resultBtn = document.querySelector("#reidBtn")
const content = document.querySelector(".content")
let model_list = new Object(); //버튼 눌렀는지 확인하기 위해

resultBtn.addEventListener("click", (e) => {
    fetch("http://localhost:8080/reid/list", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
    })
    .then((res) => res.json())
    .then((json) => { 
        const divTag1 = document.createElement("div"); //wrapper
        const divTag2 = document.createElement("div"); //query
        divTag1.setAttribute("class", "wrapper")
        divTag2.setAttribute("class", "query")
        const ulTag = document.createElement("ul"); //models
        ulTag.setAttribute("class", "models");
    
        json.model_list.forEach((model, _) => {
            model_list[model] = false
            const liTag = document.createElement("li");
            liTag.setAttribute("id", model)
            liTag.innerText = model
            ulTag.appendChild(liTag);
        })
        divTag1.appendChild(ulTag)
        divTag1.appendChild(divTag2)
        content.appendChild(divTag1)
    })
})

content.addEventListener("click", (e) => {
    let temp = e.target.textContent
    console.log(model_list)
    if (temp in model_list) { //model를 고른 경우
        for (const model_name in model_list) { //이 부분 다시 생각해보자.
            try {
                if(model_name !== temp) {
                    model_list[model_name] = false
                    console.log(model_name)
                    const noclick = document.querySelector(`#${model_name}`)
                    if(noclick.classList.contains("click")) {
                        noclick.classList.remove('click');
                    }
                } else {
                    model_list[model_name] = true
                    const click = document.querySelector(`#${model_name}`)
                    click.setAttribute("class", "click")
                }
            }
            catch(e) {
                console.error(e);
            }
        }

        fetch(`http://localhost:8080/reid/list/${temp}`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
        })
        .then((res) => res.json())
        .then((json) => { 
            const query = document.querySelector(".query")
            query.innerHTML = ''

            let ulTag = document.createElement("ul");

            json.query_list.forEach((q, idx) => {
                if((idx+1)%3==0) {
                    const liTag = document.createElement("li");
                    const aTag = document.createElement("a");
                    const href = `/reid/${temp}/${q.split('.')[0]}`
                    aTag.setAttribute("href", href)
                    aTag.innerText = q.split('.')[0]
                    liTag.appendChild(aTag)
                    ulTag.appendChild(liTag);
                    query.appendChild(ulTag)
                    ulTag = document.createElement("ul");
                } else {
                    const liTag = document.createElement("li");
                    const aTag = document.createElement("a");
                    const href = `/reid/${temp}/${q.split('.')[0]}`
                    aTag.setAttribute("href", href)
                    aTag.setAttribute("target", "_blank")
                    aTag.innerText = q.split('.')[0]
                    liTag.appendChild(aTag)
                    ulTag.appendChild(liTag);
                }
            })
            query.appendChild(ulTag)
        })
    } else { //query를 고른 경우
        try {
            let model_name = ''
            let query_name = ''

            if(Object.keys(model_list).find(key => model_list[key] === true)) {
                model_name = key
                query_name = temp
            } else {
                throw new Error(`원하는 모델에 ${temp}라는 query 존재 안 함`)
            }

            fetch(`http://localhost:8080/reid/${model_name}/${query_name}`, {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                },
            })
            .then((res) => res.json())
            .then((json) => {
                
            })
        } catch (error) {
            console.error(error)
        }
    }
})