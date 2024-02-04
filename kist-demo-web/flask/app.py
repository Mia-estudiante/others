from flask import Flask, jsonify, request
import os

app = Flask(__name__, static_folder='templates')

@app.route('/api/flask/model', methods=['POST'])
def handle_request():
    h_id = request.get_json()['id']
    gallery_path = os.path.join(os.getcwd(), 'gallery')
    res = {}

    #1) model에 입력할 query image 로드
    #2) model에 전달
    #3) model output 반환
    #4) model output을 storage에 저장

    #5) Express 서버에 알림 - 일단 query image 존재 알림을 통해 통신
    if h_id in os.listdir(gallery_path):
        res['result'] = True
    else:
        res['result'] = False
    return jsonify(res)

if __name__ == '__main__':
    app.run(port=5000,debug=True)