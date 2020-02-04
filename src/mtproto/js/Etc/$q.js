import $q from 'q';

export default function $qModule() {
    return {
        defer: () => $q.defer(),
        when: $q.when,
        reject: $q.reject,
        all: $q.all,
    };
}

$qModule.dependencies = [];
