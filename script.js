document.addEventListener("DOMContentLoaded", () => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));

  function activateTab(tab, moveFocus = false) {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.classList.toggle("is-active", selected);
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((p) => {
      p.hidden = p.id !== tab.getAttribute("aria-controls");
    });
    if (moveFocus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activateTab(tab));

    // 키보드: 좌/우 화살표로 탭 이동
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const dir = e.key === "ArrowRight" ? 1 : -1;
      activateTab(tabs[(i + dir + tabs.length) % tabs.length], true);
    });
  });

  /* ================== 고객센터 ================== */
  const form = document.getElementById("consult-form");
  if (!form) return; // 상담 폼이 없는 페이지

  const typeSelect = document.getElementById("type");
  const typeHint = document.getElementById("type-hint");
  const tel = document.getElementById("tel");
  const telMsg = document.getElementById("tel-msg");
  const submitBtn = document.getElementById("submit-btn");
  const formStatus = document.getElementById("form-status");
  const myList = document.getElementById("my-list");
  const listEmpty = document.getElementById("list-empty");
  const reservation = document.getElementById("reservation");

  const TYPE_INFO = {
    학적: "학적 상담 · 평일 09:00~18:00",
    수강: "수강·출석 상담 · 평일 09:00~18:00",
    성적: "성적·학점 상담 · 평일 10:00~17:00",
    시스템: "시스템 상담 · 평일 09:00~21:00",
  };
  const PHONE_RE = /^01[016789]-\d{3,4}-\d{4}$/;

  // 예약 내역 (새로고침하면 초기화)
  let list = [];

  // 숫자만 남기고 010-1234-5678 형태로 변환
  function formatPhone(value) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    if (d.length <= 10)
      return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }

  // 안내 문구와 색을 함께 바꿈
  function setMsg(el, text, kind) {
    el.textContent = text;
    el.classList.toggle("is-valid", kind === "valid");
    el.classList.toggle("is-invalid", kind === "invalid");
  }

  // 연락처 검사: 안내 문구, 테두리, 버튼 상태 변경
  function checkTel() {
    const empty = tel.value === "";
    const valid = PHONE_RE.test(tel.value);

    tel.classList.toggle("is-valid", valid);
    tel.classList.toggle("is-invalid", !empty && !valid);
    submitBtn.disabled = !valid;

    if (empty) setMsg(telMsg, "연락처를 입력해 주세요.");
    else if (valid) setMsg(telMsg, "올바른 연락처입니다.", "valid");
    else
      setMsg(
        telMsg,
        "휴대폰 번호 형식(010-1234-5678)에 맞게 입력해 주세요.",
        "invalid",
      );
  }

  // 예약 내역 목록 그리기
  function showList() {
    myList.innerHTML = "";
    list.forEach((r, i) => {
      const li = document.createElement("li");
      li.className = r.canceled ? "list-item is-canceled" : "list-item";
      li.innerHTML = `
        <span class="badge">${r.canceled ? "취소됨" : "예약중"}</span>
        <strong>${r.label} 상담</strong>
        <span class="tel">${r.tel}</span>
        <button type="button" data-i="${i}">${r.canceled ? "다시 예약" : "예약 취소"}</button>`;
      myList.appendChild(li);
    });
    listEmpty.hidden = list.length > 0; // 내역이 없으면 안내 표시
  }

  // change 이벤트
  typeSelect.addEventListener("change", () => {
    typeHint.textContent = TYPE_INFO[typeSelect.value];
    setMsg(formStatus, "");
  });

  // input 이벤트
  tel.addEventListener("input", () => {
    tel.value = formatPhone(tel.value);
    setMsg(formStatus, "");
    checkTel();
  });

  // 예약 버튼
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!PHONE_RE.test(tel.value)) return;

    const type = typeSelect.value;
    const label = typeSelect.options[typeSelect.selectedIndex].text;

    // 같은 유형으로 예약중인 상담이 있으면 막음
    const dup = list.some((r) => r.type === type && !r.canceled);
    if (dup) {
      setMsg(
        formStatus,
        `이미 예약중인 ${label} 상담이 있습니다. 다른 유형을 선택하거나 아래에서 기존 예약을 취소해 주세요.`,
        "invalid",
      );
      return;
    }

    list.unshift({ type, label, tel: tel.value, canceled: false });
    showList();
    setMsg(formStatus, `${label} 상담이 예약되었습니다.`, "valid");

    // 다음 예약을 위해 연락처 초기화
    tel.value = "";
    checkTel();
  });

  // 예약 취소 / 다시 예약
  myList.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const r = list[btn.dataset.i];

    if (!r.canceled) {
      r.canceled = true;
      setMsg(formStatus, "");
      showList();
    } else {
      // 취소한 예약의 정보를 폼에 다시 채움
      typeSelect.value = r.type;
      typeHint.textContent = TYPE_INFO[r.type];
      tel.value = r.tel;
      checkTel();
      setMsg(
        formStatus,
        "예약 정보를 불러왔습니다. '상담 예약'을 눌러 주세요.",
      );
      tel.focus();
    }
  });

  // 내역이 없을 때 다음 행동: 폼으로 이동
  reservation.addEventListener("click", () => typeSelect.focus());

  showList();
});
