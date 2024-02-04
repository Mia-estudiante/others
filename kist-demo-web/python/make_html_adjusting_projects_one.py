import os
import csv
#%%
# ROOT = '/static'
ROOT = os.path.join(os.getcwd(), 'public')

GALLERY_TEST_PATH = os.path.join(ROOT, 'market1501/query') #gallery 이미지 폴더 -> csv 내 fn_name과 연결할 것(GALLERY_TEST_PATH와 csv 내 fn_name과 하나하나 join)
IMG_GALLERY_TEST_PATH = os.path.join('/static', 'market1501/gallery')
CSV_GALLERY_TEST_PATH = os.path.join(ROOT, 'models_static/reid_lup_duke_backaug075/reid_lup_duke_backaug075/results_csv/market1501')
QUERY_PATH = os.path.join(ROOT, 'market1501/query') #query 이미지 폴더 -> csv명과 연결할 것(QUERY_PATH와 csv명과 join)
REPOSITORY = os.path.join(ROOT, 'views/html/models_static/reid_lup_duke_backaug075') #html 파일이 저장될 곳 -> csv명과 동일하게 파일 제작

#%%
def head():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Re-ID Project</title>
        <link rel="stylesheet" href="/static/views/style/models_static/style.css">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=PT+Serif&display=swap" rel="stylesheet">
    </head>
    """

def body_header():
    return """
    <header class="title-container">
        <div>
            <span class="status"></span>
            <h1 class="page-title">Results</h1>
        </div>
    </header>
    """

def query_container(query_path, query_name):
    query_container_header =  """
    <header class="query-container-header">
        <div>
            <span class="status"></span>
            <h1 class="query-title">Query Image</h1>
        </div>
    </header>
    """
# /static/market1501/query/1501_c6s4_001877_00.jpg
    query_person = f'<ul class="query-list">\
                        <li class="query-person">\
                            <img src="{query_path}" alt=""> \
                            <div class="id-info">\
                                <span class="ped">Pedestrian ID</span>\
                                <span class="ped-id">{query_name}</span>\
                            </div>\
                        </li>\
                    </ul>\
                    '

    return '<aside class="query-container">'+query_container_header+query_person+'</aside>'

def cctv_container_header(CAMID):
    return (
        f'<header class="cctv-container-title">\
            <h2 class="cctv-id">CAMID {CAMID}</h2>\
        </header>'\
    )

def make_gallery_person(gallery_path, PID, score):
    return (
        f'<li class="gallery-person">\
            <img src="{gallery_path}" alt="">\
            <div class="id-info">\
                <span class="ped">Pedestrian</span>\
                <span class="ped-id">{PID}</span>\
                <span class="map">{score}</span>\
            </div>\
        </li>'\
    )   

def gallery_container_header():
    return """
    <header class="gallery-container-header">
        <div>
            <span class="status"></span>
            <h1 class="gallery-title">Gallery</h1>
        </div>
    </header>
    """

def make_cctv_container(CAMID, gallery_persons):
    cctv_container = '<article class="cctv-container">'+cctv_container_header(CAMID)
    gallery_string = '<ul class="gallery-list">'
    gallery_ = list()

    for person in gallery_persons:
        gallery_path = os.path.join(IMG_GALLERY_TEST_PATH, person[0])
        gallery_.append(make_gallery_person(gallery_path,  person[0].split('.')[0], person[2]))
    gallery_ = ''.join(gallery_)

    return cctv_container+gallery_string+gallery_+'</ul></article>'

def make_html_text(query_image, csv_name, html_name):

    query_images = os.listdir(QUERY_PATH)
    print(query_images)
    REAL_PATH = '/static/market1501/query'
    query_image_path = os.path.join(REAL_PATH, query_image)
    csv_path = os.path.join(CSV_GALLERY_TEST_PATH, csv_name)

    cctv_dict = dict()

    with open(csv_path, 'r', encoding='utf-8') as f:
        csv_reader = csv.reader(f)
        next(csv_reader) #column 
        next(csv_reader) #query 이미지 내용
        for line in csv_reader:
            fn_name, PID, CAMID, score = line #gallery 파일명, PersonID, CCTVID
            if CAMID not in cctv_dict:
                cctv_dict[CAMID] = list()
                cctv_dict[CAMID].append((fn_name, PID, score))
            else: 
                cctv_dict[CAMID].append((fn_name, PID, score))
        
        # for value in cctv_dict.values():
        #     value.sort(key=lambda value: value[2], reverse=True)
        # sorted(cctv_dict.keys())

        query_container_ = query_container(query_image_path, query_image.split('.')[0])
        html_str = head()+'<body>'+body_header()+'<main class="main-container">'+query_container_
        
        cctv_ = list()
        for CAMID, gallery_persons in sorted(cctv_dict.items()):
            # print(CAMID, gallery_persons)
            gallery_persons.sort(key=lambda value: value[2], reverse=True)
            cctv_.append(make_cctv_container(CAMID, gallery_persons))
        cctv_ = ''.join(cctv_)
        gallery_container = '<section class="gallery-container">'+gallery_container_header()+'<div>'
        gallery_container+=cctv_+'</div>'+'</section>'

        html_str+=gallery_container+'</main>'+'</body>'+'</html>'
        #%%
        html_name = os.path.join(REPOSITORY, html_name)
        html_file = open(html_name, 'w')
        html_file.write(html_str)
        html_file.close()
        print(html_name)
#%%
if __name__ == "__main__":
    query_image = '1501_c6s4_001877_00.jpg'
    html_name = query_image.split('.')[0]+'.html'
    csv_name = query_image.split('.')[0]+'.csv'
    make_html_text(query_image, csv_name, html_name)


# %%
