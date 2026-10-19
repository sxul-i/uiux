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

  // 상단 메뉴(학습활동/학점/학사공지) 클릭 시 해당 탭도 함께 활성화
  document.querySelectorAll("nav a[data-tab]").forEach((link) => {
    link.addEventListener("click", () => {
      const tab = document.getElementById(`tab-${link.dataset.tab}`);
      if (tab) activateTab(tab);
    });
  });

  /* ================== 고객센터 ================== */
  const form = document.getElementById("consult-form");
  const typeSelect = document.getElementById("type");
  const typeHint = document.getElementById("type-hint");
  const tel = document.getElementById("tel");
  const telMsg = document.getElementById("tel-msg");
  const submitBtn = document.getElementById("submit-btn");

  const TYPE_INFO = {
    학적: "학적 상담 · 평일 09:00~18:00",
    수강: "수강·출석 상담 · 평일 09:00~18:00",
    성적: "성적·학점 상담 · 평일 10:00~17:00",
    시스템: "시스템 상담 · 평일 09:00~21:00",
  };

  // 숫자만 남기고 010-1234-5678 / 010-123-4567 형태로 변환
  function formatPhone(value) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    if (d.length <= 10)
      return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }

  const PHONE_RE = /^01[016789]-\d{3,4}-\d{4}$/;

  // change 이벤트
  typeSelect.addEventListener("change", () => {
    typeHint.textContent = TYPE_INFO[typeSelect.value];
    resetDone();
  });

  // input 이벤트
  tel.addEventListener("input", () => {
    tel.value = formatPhone(tel.value);
    resetDone();

    const empty = tel.value === "";
    const valid = PHONE_RE.test(tel.value);

    // 문구 + 스타일 + 버튼 상태가 함께 변경
    tel.classList.toggle("is-valid", valid);
    tel.classList.toggle("is-invalid", !empty && !valid);
    telMsg.classList.toggle("is-valid", valid);
    telMsg.classList.toggle("is-invalid", !empty && !valid);
    submitBtn.disabled = !valid;

    if (empty) telMsg.textContent = "연락처를 입력해 주세요.";
    else if (valid) telMsg.textContent = "올바른 연락처입니다.";
    else
      telMsg.textContent =
        "휴대폰 번호 형식(010-1234-5678)에 맞게 입력해 주세요.";
  });

  // click(제출) 이벤트
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!PHONE_RE.test(tel.value)) return;

    submitBtn.textContent = "예약 완료";
    submitBtn.classList.add("is-done");
    submitBtn.disabled = true;
    tel.readOnly = true;
    typeSelect.disabled = true;
    telMsg.textContent = `${typeSelect.options[typeSelect.selectedIndex].text} 상담이 예약되었습니다. 상담원이 ${tel.value}로 연락드립니다.`;
  });

  // 입력을 다시 바꾸면 예약 완료 표시 해제
  function resetDone() {
    if (!submitBtn.classList.contains("is-done")) return;
    submitBtn.classList.remove("is-done");
    submitBtn.textContent = "상담 예약";
  }

  // 예약 완료 후 연락처를 다시 수정할 수 있게: 더블클릭으로 잠금 해제
  tel.addEventListener("dblclick", () => {
    if (!tel.readOnly) return;
    tel.readOnly = false;
    typeSelect.disabled = false;
    resetDone();
    tel.dispatchEvent(new Event("input"));
  });
});
