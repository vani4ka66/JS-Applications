$(() => {
    const context = {
        cats: []
    };
    renderCatTemplate();

    async function renderCatTemplate() {
        context.cats = window.cats;

        let source = document.getElementById('cat-template').innerHTML;

        let template = Handlebars.compile(source);
        let container = document.getElementById('allCats');

        container.innerHTML = template(context);
        attachHandlers();

    };

    function attachHandlers() {
        $('.btn-primary').click((e) => {
            //let index = $(e.target).next().attr('data-index');
            let id = $(e.target).next().attr('id');

            document.getElementById(id).style.display = "block";
        })
    };
})

