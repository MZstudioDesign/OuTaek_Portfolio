/**
 * Beliefs Renderer Module
 * Renders the specific "My Beliefs" (나의 신념) story layout.
 * 
 * @module modules/beliefs-renderer
 */

export function renderBeliefsContent(modal, item) {
    const imagesContainer = modal.querySelector('.modal-images');
    const textContainer = modal.querySelector('.modal-text');

    // Clear standard containers
    imagesContainer.innerHTML = '';
    textContainer.innerHTML = '';

    // Create a unified container for flow
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'novel-layout-wrapper';

    const images = item.images || [];

    // Helper to add text
    const addP = (html) => {
        const p = document.createElement('p');
        p.innerHTML = html;
        contentWrapper.appendChild(p);
    };

    // Helper to add Image
    const addImg = (index) => {
        if (images[index]) {
            const img = document.createElement('img');
            // Check for object or string (defensive)
            const url = images[index].url || images[index];
            img.src = url;
            img.className = 'novel-inline-img';
            contentWrapper.appendChild(img);
        }
    };

    // --- Hardcoded Story Content ---

    addP(`<strong>“나는 고객에게 더 잘 해주고 싶거든.”</strong>`);
    addP(`그 말이 끝나자마자, 목이 턱 막혔습니다.<br>
    감동적인 문장이라서가 아니었습니다.<br>
    그 말엔 <strong>포장이 하나도 없었기 때문</strong>입니다.`);

    addP(`부산 기장, 고기집 소담.<br>
    저녁을 먹기 조금 이른 오후 5시였습니다.<br>
    밝은 조명 아래 고기가 지글지글 익고, 소주가 한 잔씩 돌았습니다.`);

    addP(`술자리는 흔히 흐트러지는데, 그날은 반대였습니다.<br>
    오히려 말이 또렷해지는 자리였습니다.<br>
    도망갈 수 없는 자리.`);

    addP(`10년 동안 이삿짐 일을 해온 형이 덧붙였습니다.<br>
    <strong>“나는 내 일에 자부심이 있어.”</strong>`);

    addP(`그 순간 저는 아주 선명하게 알았습니다.<br>
    지금 내 안에서 무뎌지고 있는 게 무엇인지.`);

    addP(`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0;">`);

    addP(`<strong>저는 ‘있던 마음이 없어지는 것’에 익숙해지지 않기 위해, 일을 합니다.</strong>`);

    addP(`처음엔 아주 사소한 감각에서 시작됐습니다.<br>
    사람은 참 빨리 익숙해집니다.<br>
    있던 게 사라져도, 없던 게 생겨도, 결국 “원래 그랬던 것처럼” 살아갑니다.`);

    addP(`그 이상한 익숙함이, 마음에도 생기는 순간이 있습니다.<br>
    분명 내 안에 있던 마음이<br>
    어느 날부터는 “원래 없었던 것처럼” 흐려지는 느낌.<br>
    더 무서운 건,<br>
    그 흐려짐이 대단한 사건 없이도 자연스럽게 찾아온다는 사실이었습니다.`);

    addP(`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0;">`);

    addP(`그날은 12월 20일이었습니다.<br>
    겨울인데도 날씨가 이상하게 따뜻했어요. 17도쯤.<br>
    엄마, 아빠, 외할머니까지 모시고 넷이 차에 올랐습니다.<br>
    목적지는 주류 박람회였습니다.`);

    addP(`예전엔 모든 게 새로웠는데, 그날은 달랐습니다.<br>
    “자주 오니까… 그 맛이 그 맛 같고, 거기가 거기 같더라.”`);

    addP(`좋아하던 걸 좋아하지 못하게 된 게 아니라,<br>
    좋아하던 감각이 <strong>무뎌진</strong> 느낌이었습니다.`);

    addP(`그리고 저는 알고 있었습니다.<br>
    그 무뎌짐이 술 때문만은 아니라는 걸요.<br>
    감각이 무뎌지듯, 마음도 무뎌질 수 있고<br>
    사람은 거기에 익숙해질 수도 있다는 걸요.`);

    addP(`그래서일까요.<br>
    그날 오후 5시, 소담의 밝은 조명 아래에서 들은 그 한마디가<br>
    더 크게 들렸습니다.`);

    addP(`<strong>“나는 고객에게 더 잘 해주고 싶거든.”</strong>`);

    addP(`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0;">`);

    addP(`그 말을 듣는 순간, 제 안에서 오래된 장면 하나가 떠올랐습니다.<br>
    디자인 스튜디오를 처음 시작하던 때의 저였습니다.`);

    addP(`처음 2년 전, 저는 분명히 이런 사람이었습니다.<br>
    돈이 얼마가 되든 상관없이<br>
    누군가에게 “도움이 되는 결과물”을 만들고 싶었습니다.`);

    addP(`요청이 없더라도 조금 더 설명해주고,<br>
    조금 더 디테일을 챙기고,<br>
    조금이라도 상대가 편해질 수 있다면<br>
    한 번 더 생각하던 사람이었습니다.<br>
    그게 좋아서 이 일을 시작했습니다.`);

    addP(`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0;">`);

    addP(`저는 실제로 그런 일을 했습니다.<br>
    새로 오픈한 치킨집의 <strong>메뉴판 작업</strong>을 맡았을 때였습니다.`);

    addP(`메뉴판 디자인 참고용으로 매장 사진을 받았는데,<br>
    그중 한 장에서 벽에 붙은 A4용지가 눈에 들어왔습니다.<br>
    흰 종이에 글자만 덩그러니 적혀 있었어요.<br>
    “리뷰 남겨주시면 정말 감사드리겠습니다.”`);

    addP(`이상하게 그 장면이 오래 남았습니다.<br>
    못해서가 아니라,<br>
    바쁜 와중에도 손님에게 말을 걸고 싶었던 마음이 보였거든요.<br>
    방법이 마땅치 않아 종이 한 장으로라도 꺼낸 말 같았습니다.`);

    addP(`작업을 진행하던 중, 클라이언트가 조심스럽게 물었습니다.<br>
    “메뉴판 아래에 ‘리뷰 부탁드립니다’ 문구도 추가해주실 수 있을까요?<br>
    추가비용이 발생하면 내겠습니다.”`);

    addP(`저는 말했습니다.<br>
    “아닙니다. 그냥 해드릴게요. 말씀만으로도 감사합니다.”`);

    addP(`그런데 저는 거기서 멈추지 못했습니다.<br>
    그 A4용지가 계속 떠올랐습니다.`);

    addP(`그래서 메뉴판 하단에 문구만 얹는 대신,<br>
    매장 분위기와 톤에 맞춘 <strong>작은 사이즈의 ‘리뷰 요청 안내문’</strong>을<br>
    계약에는 없던 작업이었지만 <strong>무료로</strong> 함께 디자인해 드렸습니다.`);

    addP(`손님은 부담 없이 읽고,<br>
    직원은 설명을 덜 반복하고,<br>
    매장은 조금 더 단정해 보일 수 있게요.`);

    addP(`그건 “더 해준다”라기보다,<br>
    그 가게가 덜 어색하게 손님에게 말을 걸 수 있길 바라는 마음이었습니다.<br>
    <strong>그 한 장이, 그 가게의 목소리가 되길 바랐습니다.</strong>`);


    addImg(0);

    addP(`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0;">`);

    addP(`저는 종종 이런 방식으로 일을 해왔습니다.<br>
    클라이언트가 “이런 디자인을 원해요”라고 말하면<br>
    그걸 그대로 ‘요구사항’으로만 받아 적지 않았습니다.`);

    addP(`가게의 공기와 결,<br>
    사장님의 말투와 취향,<br>
    동네가 주는 인상까지 떠올리며 조사했습니다.`);

    addP(`그리고 고객이 요청하지 않았는데도 제안했습니다.<br>
    “사장님 말씀을 기준으로 보면<br>
    이 방향이 더 잘 어울릴 것 같습니다.”`);

    addP(`그 제안 하나로 고객이 다시 찾아오기도 했습니다.<br>
    그때의 저는 ‘잘해준다’를 거창한 결심으로 하지 않았습니다.<br>
    그냥 자연스럽게, 한 번 더 생각하는 쪽으로 몸이 기울었습니다.<br>
    그리고 저는 그 기울어짐을 좋아했습니다.`);

    addP(`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0;">`);

    addP(`하지만 시간이 지나 <strong>팀으로 일하게 되면서</strong>, 제 마음에도 ‘역할’이 생겼습니다.<br>
    좋은 마음만으로는 일을 지킬 수 없었습니다.<br>
    누군가의 밤을 갈아 넣어서 만드는 ‘조금 더’는<br>
    결국 오래 못 간다는 것도 알게 됐습니다.`);

    addP(`그런데 어느 날, 아주 사소한 순간에 멈칫했습니다.<br>
    채팅창에 커서가 깜빡이고 있었고,<br>
    저는 아무렇지 않게 팀원에게 말하고 있더라고요.<br>
    “이것도 좀 더 해줘.”<br>
    “저것도 조금만 더 신경 써줘.”`);

    addP(`보내고 나서 손이 잠깐 멈췄습니다.<br>
    예전의 ‘조금 더’는 제가 제 마음으로 선택하던 태도였는데,<br>
    그 순간부터는 누군가의 어깨에 얹히는 <strong>부담</strong>이 될 수도 있다는 걸<br>
    정확히 깨달았기 때문입니다.`);

    addP(`그때 저는 처음으로<br>
    ‘선을 긋는 일’이 차갑기 때문이 아니라<br>
    <strong>사람을 지키기 위해 필요할 수도 있다</strong>는 걸 배웠습니다.`);

    addP(`하지만 동시에, 이런 마음도 남았습니다.<br>
    선을 지키는 순간, 내가 좋아하던 어떤 마음이<br>
    조금씩 사라지는 것 같다는 감각.<br>
    그래서 저는 다시 질문했습니다.<br>
    <strong>“잘해준다는 건 도대체 뭘까?”</strong>`);

    addP(`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0;">`);

    addP(`저는 결국, 이렇게 정리했습니다.`);

    addP(`<strong>A Little More.</strong>`);

    addP(`‘무조건 더 하기’가 아니라,<br>
    <strong>선 안에서 마음을 잃지 않는 방식</strong>을 만들겠다는 다짐.<br>
    그 다짐이 감성으로만 끝나지 않게,<br>
    저는 일하는 기준을 세 개로 고정했습니다.`);

    addP(`- <strong>계약 범위는 명확히 하되, 설명은 더 친절하게</strong><br>
    - <strong>결과물은 깔끔히, 의도와 맥락은 더 자세히</strong><br>
    - <strong>수정은 제한하되, 결정은 더 쉽게</strong>`);

    addP(`이건 “서비스를 더 주겠다”가 아니라<br>
    “상대가 덜 불안하게 하겠다”에 가깝습니다.`);

    addP(`선을 긋더라도, 그 선이 상대를 밀어내는 선이 아니라<br>
    상대가 이해할 수 있는 선이 되게 하는 것.<br>
    결과물을 깔끔하게 내되, 왜 이렇게 했는지 마음까지 전달하는 것.<br>
    수정은 제한하되, 선택은 더 쉽게 만들어서<br>
    결정을 돕는 것.<br>
    저는 그게 제가 할 수 있는<br>
    가장 현실적인 ‘조금 더’라고 믿습니다.`);


    addImg(1);

    addP(`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0;">`);

    addP(`그리고 가끔, 고객이 먼저 그걸 증명해줍니다.<br>
    “일처리 방식이 감동이었다.”<br>
    “제안서를 보고 다른 곳과 차원이 달랐다.”<br>
    “앞으로도 계속 같이 일하고 싶다.”`);

    addP(`그 말들을 읽을 때, 저는 이상하게 결과물보다<br>
    <strong>과정이 떠오릅니다.</strong>`);

    addP(`설명 한 줄을 더 붙였던 순간.<br>
    결정이 쉬워지도록 선택지를 정리했던 순간.<br>
    상대가 말로 다 못한 걸 대신 정리해줬던 순간.`);

    addP(`그때 저는 확신합니다.<br>
    사람은 결과물만 보고 감동하지 않는다는 걸요.<br>
    <strong>태도와 과정</strong>이 결국 ‘신뢰’가 된다는 걸요.`);

    addP(`<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 3rem 0;">`);

    addP(`그리고 저는 가끔 10년 뒤의 저를 상상합니다.<br>
    여전히 어딘가의 밝은 조명 아래서,<br>
    누군가와 마주 앉아<br>
    “일”이라는 단어를 꺼내는 순간.`);

    addP(`그때의 제가 오늘의 저처럼 담담히 말할 수 있었으면 좋겠습니다.<br>
    포장이 아니라 진짜로, 흔들림 없이.<br>
    “나는 내 일에 자부심이 있어.”<br>
    “나는 고객에게 잘 해주고 싶거든.”`);

    addP(`그 말이 누군가의 목을 턱 막히게 만들 정도로,<br>
    그 마음이 제 안에서 사라지지 않고 남아 있기를.<br>
    그래서 저는 오늘도 일을 합니다.<br>
    ‘있던 마음’을 잃지 않기 위해.`);

    addP(`그리고 조용히,<br>
    여기서 멈출 수 있었지만 한 번 더 하기로 선택하는 사람으로.`);

    addP(`<strong>A Little More.</strong>`);


    addImg(2);

    textContainer.appendChild(contentWrapper);
}
